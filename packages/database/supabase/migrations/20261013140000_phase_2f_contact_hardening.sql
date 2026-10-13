begin;

alter table public.contact_requests
    add column subject text not null default 'Business inquiry',
    add column idempotency_key uuid not null default gen_random_uuid(),
    add constraint contact_requests_subject_length check (char_length(subject) between 1 and 200);

alter table public.contact_requests alter column subject drop default;
create unique index contact_requests_sender_idempotency_idx
    on public.contact_requests(sender_user_id, idempotency_key);

drop function public.create_contact_request(text, text, text, text, integer, text, text);
create function public.create_contact_request(
    p_target_slug text, p_idempotency_key uuid, p_first_name text,
    p_work_email text, p_phone_number text, p_years_of_service integer,
    p_contact_preference text, p_subject text, p_message text default null
) returns table(
    request_id uuid, request_status public.contact_request_status,
    routing_status public.contact_request_routing_status, created_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
    actor_id uuid := auth.uid(); sender_org_id uuid; sender_org_ids uuid[]; sender_count integer;
    target_profile public.directory_profiles%rowtype; recipient_membership_id uuid; recipient_user_id uuid;
    route_status public.contact_request_routing_status; new_request_id uuid; event_time timestamptz := timezone('utc', now());
    existing public.contact_requests%rowtype;
begin
    if actor_id is null then raise insufficient_privilege using message = 'Authentication is required.'; end if;
    if p_idempotency_key is null then raise invalid_parameter_value using message = 'Idempotency key is required.'; end if;

    select * into existing from public.contact_requests
    where sender_user_id = actor_id and idempotency_key = p_idempotency_key;
    if found then
        return query select existing.id, existing.status, existing.routing_status, existing.created_at;
        return;
    end if;

    if (select count(*) from public.contact_requests where sender_user_id = actor_id and created_at > event_time - interval '10 minutes') >= 5 then
        raise sqlstate 'P0001' using message = 'Contact request rate limit exceeded.';
    end if;

    select count(*), array_agg(e.organization_id order by e.organization_id) into sender_count, sender_org_ids from (
        select distinct om.organization_id from public.organization_members om
        join public.organizations o on o.id = om.organization_id
        join public.directory_profiles dp on dp.organization_id = om.organization_id
        join public.directory_profile_versions v on v.id = dp.published_version_id and v.is_published
        join public.businesses b on b.id = v.business_id and b.organization_id = om.organization_id
        where om.user_id = actor_id and om.status = 'active'
          and dp.status = 'approved' and o.status = 'active' and b.status = 'active'
          and public.is_business_ein_verified(b.id)
    ) e;
    if sender_count <> 1 then raise object_not_in_prerequisite_state using message = 'Sender Directory eligibility is not satisfied or is ambiguous.'; end if;
    sender_org_id := sender_org_ids[1];

    select dp.* into target_profile from public.directory_profiles dp
    join public.directory_profile_versions v on v.id = dp.published_version_id and v.is_published
    join public.organizations o on o.id = dp.organization_id
    join public.businesses b on b.id = v.business_id and b.organization_id = dp.organization_id
    where v.slug = lower(btrim(p_target_slug)) and dp.status = 'approved'
      and o.status = 'active' and b.status = 'active' and public.is_business_ein_verified(b.id)
    limit 1;
    if not found then raise no_data_found using message = 'Contactable Directory profile not found.'; end if;

    select om.id, om.user_id into recipient_membership_id, recipient_user_id
    from public.organization_members om
    where om.organization_id = target_profile.organization_id and om.status = 'active' and om.role = 'admin'
    order by om.created_at, om.user_id limit 1;
    if recipient_user_id is null then
        select om.id, om.user_id into recipient_membership_id, recipient_user_id
        from public.organization_members om
        where om.organization_id = target_profile.organization_id and om.status = 'active' and om.role = 'owner'
        order by om.created_at, om.user_id limit 1;
    end if;
    route_status := case when recipient_user_id is null then 'needs_assignment' else 'routed' end;

    insert into public.contact_requests(
        sender_user_id, sender_organization_id, target_profile_id, target_organization_id,
        target_slug, target_display_name, routed_recipient_membership_id, routed_recipient_user_id,
        routing_status, first_name, work_email, phone_number, years_of_service,
        contact_preference, subject, message, idempotency_key, created_at, updated_at
    ) values (
        actor_id, sender_org_id, target_profile.id, target_profile.organization_id,
        lower(btrim(p_target_slug)),
        (select display_name from public.directory_profile_versions where id = target_profile.published_version_id),
        recipient_membership_id, recipient_user_id, route_status, btrim(p_first_name), lower(btrim(p_work_email)),
        btrim(p_phone_number), p_years_of_service, p_contact_preference, btrim(p_subject),
        nullif(btrim(p_message), ''), p_idempotency_key, event_time, event_time
    ) returning id into new_request_id;

    insert into public.contact_request_history(contact_request_id, actor_user_id, action, new_status, created_at) values
        (new_request_id, actor_id, 'created', 'new', event_time),
        (new_request_id, actor_id, case when recipient_user_id is null then 'manual_assignment_needed' else 'routed' end, 'new', event_time);
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(target_profile.organization_id, actor_id, 'create', 'contact_request', new_request_id, jsonb_build_object('routing_status', route_status));
    return query select new_request_id, 'new'::public.contact_request_status, route_status, event_time;
end;
$$;

revoke all on function public.create_contact_request(text, uuid, text, text, text, integer, text, text, text) from public, anon, authenticated;
grant execute on function public.create_contact_request(text, uuid, text, text, text, integer, text, text, text) to authenticated;

drop function public.list_inbound_contact_requests(uuid, public.contact_request_status, integer, integer);
create function public.list_inbound_contact_requests(
    p_organization_id uuid, p_status public.contact_request_status default null,
    p_limit integer default 20, p_offset integer default 0
) returns table(
    request_id uuid, request_status public.contact_request_status,
    routing_status public.contact_request_routing_status, first_name text,
    work_email text, phone_number text, years_of_service integer,
    contact_preference text, subject text, message text,
    created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
    if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise insufficient_privilege; end if;
    if p_limit < 1 or p_limit > 51 or p_offset < 0 or p_offset > 10000 then raise invalid_parameter_value; end if;
    return query select cr.id, cr.status, cr.routing_status, cr.first_name, cr.work_email,
        cr.phone_number, cr.years_of_service, cr.contact_preference, cr.subject, cr.message,
        cr.created_at, cr.updated_at
    from public.contact_requests cr
    where cr.target_organization_id = p_organization_id and (p_status is null or cr.status = p_status)
    order by cr.created_at desc, cr.id desc limit p_limit offset p_offset;
end;
$$;

revoke all on function public.list_inbound_contact_requests(uuid, public.contact_request_status, integer, integer) from public, anon, authenticated;
grant execute on function public.list_inbound_contact_requests(uuid, public.contact_request_status, integer, integer) to authenticated;

commit;
