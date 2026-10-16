-- Cobalt TIN verification: admin-only, idempotent, rate-limited, and auditable.
begin;

alter table public.ein_verifications
    add column if not exists provider_mode text not null default 'mock',
    add column if not exists response_code text,
    add column if not exists request_fingerprint text;

alter table public.businesses
    add column if not exists ein_identity_updated_at timestamptz
    not null default timezone('utc', now());

alter table public.ein_verifications
    drop constraint if exists ein_verifications_provider_mode_check;
alter table public.ein_verifications
    add constraint ein_verifications_provider_mode_check
    check (provider_mode in ('mock', 'live'));

create unique index if not exists ein_verifications_active_fingerprint_idx
    on public.ein_verifications(verification_item_id, provider, provider_mode, request_fingerprint)
    where completed_at is null and request_fingerprint is not null;

create or replace function public.get_ein_secret_for_verification(
    p_actor_user_id uuid,
    p_verification_item_id uuid
)
returns table (
    business_id uuid, legal_name text, ein_last_four text,
    ciphertext text, iv text, auth_tag text, key_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_actor_user_id is null or not exists (
        select 1 from auth.users where id = p_actor_user_id
    ) or not exists (
        select 1 from public.user_platform_roles
        where user_id = p_actor_user_id and role = 'admin'::public.platform_role
    ) then
        raise insufficient_privilege using message = 'Platform administrator permission is required.';
    end if;

    if not exists (
        select 1 from public.verification_items vi
        join public.verification_cases vc on vc.id = vi.verification_case_id
        join public.business_ein_secrets bes on bes.business_id = vc.business_id
        where vi.id = p_verification_item_id
          and vi.item_type = 'ein'::public.verification_item_type
    ) then
        raise sqlstate 'P0003' using message = 'Encrypted EIN not found.';
    end if;

    return query
    select b.id, b.legal_name, b.ein_last_four,
           bes.ciphertext, bes.iv, bes.auth_tag, bes.key_version
    from public.verification_items vi
    join public.verification_cases vc on vc.id = vi.verification_case_id
    join public.businesses b on b.id = vc.business_id
                            and b.organization_id = vc.organization_id
    join public.business_ein_secrets bes on bes.business_id = b.id
    where vi.id = p_verification_item_id
      and vi.item_type = 'ein'::public.verification_item_type;
end;
$$;

revoke all on function public.get_ein_secret_for_verification(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.get_ein_secret_for_verification(uuid, uuid)
to service_role;

drop function if exists public.request_ein_verification(uuid, text, text);

create function public.request_ein_verification(
    p_actor_user_id uuid,
    p_verification_item_id uuid,
    p_ein_last_four text,
    p_provider text,
    p_provider_mode text,
    p_request_fingerprint text
)
returns table (
    ein_verification_id uuid,
    organization_id uuid,
    business_id uuid,
    legal_name text,
    verification_item_id uuid,
    should_call_provider boolean,
    provider_reference text,
    result_status text,
    result_reason text,
    response_code text,
    completed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    target_organization_id uuid;
    target_business_id uuid;
    target_legal_name text;
    stored_ein_last_four text;
    previous_item_status public.verification_item_status;
    prior_attempt public.ein_verifications%rowtype;
    attempt_id uuid;
begin
    if p_actor_user_id is null or not exists (
        select 1 from auth.users where id = p_actor_user_id
    ) or not exists (
        select 1 from public.user_platform_roles
        where user_id = p_actor_user_id and role = 'admin'::public.platform_role
    ) then
        raise insufficient_privilege using message = 'Platform administrator permission is required.';
    end if;

    if p_provider_mode not in ('mock', 'live')
       or p_request_fingerprint !~ '^[0-9a-f]{64}$' then
        raise invalid_parameter_value using message = 'Invalid EIN verification request.';
    end if;

    select vc.organization_id, vc.business_id,
           b.legal_name, b.ein_last_four, vi.status
    into target_organization_id, target_business_id,
         target_legal_name, stored_ein_last_four, previous_item_status
    from public.verification_items vi
    join public.verification_cases vc on vc.id = vi.verification_case_id
    join public.businesses b on b.id = vc.business_id
                             and b.organization_id = vc.organization_id
    where vi.id = p_verification_item_id
      and vi.item_type = 'ein'::public.verification_item_type
    for update of vi;

    if target_organization_id is null then
        raise no_data_found using message = 'EIN verification item not found.';
    end if;
    if exists (
        select 1 from public.organization_members
        where organization_id = target_organization_id
          and user_id = p_actor_user_id
          and status = 'active'::public.membership_status
    ) then
        raise insufficient_privilege using message = 'Administrators cannot review their own organization submission.';
    end if;
    if stored_ein_last_four is null or stored_ein_last_four <> p_ein_last_four then
        raise invalid_parameter_value using message = 'EIN does not match intake data.';
    end if;

    select ev.* into prior_attempt
    from public.ein_verifications ev
    where ev.verification_item_id = p_verification_item_id
      and ev.provider = p_provider
      and ev.provider_mode = p_provider_mode
      and ev.request_fingerprint = p_request_fingerprint
      and (
          ev.completed_at is null
          or ev.result_status in ('match', 'invalid_tin', 'tin_not_issued', 'name_mismatch', 'invalid_request', 'reuse_existing', 'pending', 'manual_review')
      )
    order by ev.requested_at desc, ev.id desc
    limit 1;

    if prior_attempt.id is not null then
        return query select prior_attempt.id, target_organization_id,
            target_business_id, target_legal_name, p_verification_item_id,
            false, prior_attempt.provider_reference, prior_attempt.result_status,
            prior_attempt.result_reason, prior_attempt.response_code,
            prior_attempt.completed_at;
        return;
    end if;

    if previous_item_status not in ('pending', 'in_review', 'rejected', 'correction_required') then
        raise object_not_in_prerequisite_state using
            message = 'EIN verification cannot start from the current item status.';
    end if;
    if (select count(*) from public.ein_verifications
        where requested_by_user_id = p_actor_user_id
          and requested_at > timezone('utc', now()) - interval '5 minutes') >= 5 then
        raise sqlstate 'P0004' using message = 'EIN verification rate limit exceeded.';
    end if;

    insert into public.ein_verifications (
        verification_item_id, provider, provider_mode, request_fingerprint,
        requested_by_user_id, result_status
    ) values (
        p_verification_item_id, p_provider, p_provider_mode,
        p_request_fingerprint, p_actor_user_id, 'requested'
    ) on conflict (
        verification_item_id, provider, provider_mode, request_fingerprint
    ) where completed_at is null and request_fingerprint is not null
    do nothing returning id into attempt_id;

    if attempt_id is null then
        select ev.* into prior_attempt
        from public.ein_verifications ev
        where ev.verification_item_id = p_verification_item_id
          and ev.provider = p_provider
          and ev.provider_mode = p_provider_mode
          and ev.request_fingerprint = p_request_fingerprint
          and ev.completed_at is null
        order by ev.requested_at desc, ev.id desc limit 1;
        return query select prior_attempt.id, target_organization_id,
            target_business_id, target_legal_name, p_verification_item_id,
            false, prior_attempt.provider_reference, prior_attempt.result_status,
            prior_attempt.result_reason, prior_attempt.response_code,
            prior_attempt.completed_at;
        return;
    end if;

    update public.verification_items
    set status = 'verification_requested'::public.verification_item_status,
        verification_method = 'api'::public.verification_method
    where id = p_verification_item_id;

    insert into public.verification_item_history (
        verification_item_id, previous_status, new_status, action, actor_user_id
    ) values (
        p_verification_item_id, previous_item_status,
        'verification_requested'::public.verification_item_status,
        'verification_requested'::public.verification_history_action,
        p_actor_user_id
    );

    insert into public.audit_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, metadata
    ) values (
        target_organization_id, p_actor_user_id,
        'verification_requested'::public.audit_action, 'ein_verification', attempt_id,
        jsonb_build_object(
            'verification_item_id', p_verification_item_id,
            'provider', p_provider,
            'provider_mode', p_provider_mode,
            'request_fingerprint', p_request_fingerprint
        )
    );

    return query select attempt_id, target_organization_id, target_business_id,
        target_legal_name, p_verification_item_id, true, null::text,
        'requested'::text, null::text, null::text, null::timestamptz;
end;
$$;

revoke all on function public.request_ein_verification(uuid, uuid, text, text, text, text)
from public, anon, authenticated;
grant execute on function public.request_ein_verification(uuid, uuid, text, text, text, text)
to service_role;

drop function if exists public.complete_ein_verification(
    uuid, text, text, text, public.verification_item_status
);

create function public.complete_ein_verification(
    p_ein_verification_id uuid,
    p_provider_reference text,
    p_result_status text,
    p_result_reason text,
    p_response_code text,
    p_item_status public.verification_item_status
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid;
    target_organization_id uuid;
    target_item_id uuid;
    previous_item_status public.verification_item_status;
begin
    if p_item_status not in ('in_review', 'correction_required')
       or p_result_status not in (
           'match', 'invalid_tin', 'tin_not_issued', 'name_mismatch',
           'invalid_request', 'reuse_existing', 'pending', 'manual_review',
           'unavailable', 'invalid_response', 'provider_error'
       ) then
        raise invalid_parameter_value using message = 'Invalid provider completion.';
    end if;

    select vc.organization_id, vi.id, vi.status, ev.requested_by_user_id
    into target_organization_id, target_item_id, previous_item_status, actor_id
    from public.ein_verifications ev
    join public.verification_items vi on vi.id = ev.verification_item_id
    join public.verification_cases vc on vc.id = vi.verification_case_id
    where ev.id = p_ein_verification_id and ev.completed_at is null
    for update of ev, vi;

    if target_item_id is null then
        raise object_not_in_prerequisite_state using message = 'EIN verification attempt is unavailable.';
    end if;

    update public.ein_verifications
    set provider_reference = nullif(left(p_provider_reference, 200), ''),
        completed_at = timezone('utc', now()),
        result_status = p_result_status,
        result_reason = left(p_result_reason, 500),
        response_code = nullif(left(p_response_code, 40), '')
    where id = p_ein_verification_id;

    update public.verification_items
    set status = p_item_status,
        reviewed_by_user_id = null,
        reviewed_at = null,
        rejection_reason = null,
        correction_notes = case when p_item_status = 'correction_required'
            then left(p_result_reason, 500) else null end
    where id = target_item_id;

    insert into public.verification_item_history (
        verification_item_id, previous_status, new_status, action, reason, actor_user_id
    ) values (
        target_item_id, previous_item_status, p_item_status,
        'verification_completed'::public.verification_history_action,
        left(p_result_reason, 500), actor_id
    );

    insert into public.audit_logs (
        organization_id, actor_user_id, action, entity_type, entity_id, metadata
    ) values (
        target_organization_id, actor_id,
        'verification_completed'::public.audit_action, 'ein_verification',
        p_ein_verification_id,
        jsonb_build_object(
            'verification_item_id', target_item_id,
            'result_status', p_result_status,
            'response_code', p_response_code
        )
    );
end;
$$;

revoke all on function public.complete_ein_verification(
    uuid, text, text, text, text, public.verification_item_status
) from public, anon, authenticated;
grant execute on function public.complete_ein_verification(
    uuid, text, text, text, text, public.verification_item_status
) to service_role;

-- New legal-name or EIN intake invalidates provider evidence without deleting audit history.
create or replace function public.invalidate_ein_check_on_identity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.legal_name is distinct from old.legal_name
       or new.ein_last_four is distinct from old.ein_last_four then
        update public.businesses
        set ein_identity_updated_at = timezone('utc', now())
        where id = new.id;

        insert into public.verification_item_history (
            verification_item_id, previous_status, new_status, action, reason
        )
        select vi.id, vi.status, 'pending'::public.verification_item_status,
               'status_changed'::public.verification_history_action,
               'Business legal name or EIN changed; a new check is required.'
        from public.verification_items vi
        join public.verification_cases vc on vc.id = vi.verification_case_id
        where vc.business_id = new.id
          and vi.item_type = 'ein'::public.verification_item_type
          and vi.status <> 'pending'::public.verification_item_status;

        update public.verification_items vi
        set status = 'pending'::public.verification_item_status,
            reviewed_by_user_id = null, reviewed_at = null,
            rejection_reason = null, correction_notes = null
        from public.verification_cases vc
        where vc.id = vi.verification_case_id
          and vc.business_id = new.id
          and vi.item_type = 'ein'::public.verification_item_type;
    end if;
    return new;
end;
$$;

drop trigger if exists businesses_invalidate_ein_check on public.businesses;
create trigger businesses_invalidate_ein_check
after update of legal_name, ein_last_four on public.businesses
for each row execute function public.invalidate_ein_check_on_identity_change();

-- Approval remains a separate administrator action and only follows a current match.
create or replace function public.enforce_ein_match_before_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid := coalesce(new.reviewed_by_user_id, auth.uid());
    target_organization_id uuid;
begin
    if old.status is distinct from new.status
       and new.status in ('verified', 'rejected', 'correction_required') then
        select vc.organization_id
        into target_organization_id
        from public.verification_cases vc where vc.id = new.verification_case_id;

        if actor_id is not null and exists (
            select 1 from public.organization_members
            where organization_id = target_organization_id
              and user_id = actor_id
              and status = 'active'::public.membership_status
        ) then
            raise insufficient_privilege using message = 'Administrators cannot approve their own organization submission.';
        end if;

        if new.item_type = 'ein'::public.verification_item_type
           and new.status = 'verified'::public.verification_item_status
           and not exists (
            select 1 from public.ein_verifications ev
            join public.verification_cases vc on vc.id = new.verification_case_id
            join public.businesses b on b.id = vc.business_id
            where ev.verification_item_id = new.id
              and ev.result_status = 'match'
              and ev.completed_at is not null
              and ev.completed_at >= b.ein_identity_updated_at
              and ev.request_fingerprint = (
                  select latest.request_fingerprint
                  from public.ein_verifications latest
                  where latest.verification_item_id = new.id
                  order by latest.requested_at desc, latest.id desc limit 1
              )
        ) then
            raise object_not_in_prerequisite_state using message = 'A current EIN match is required before approval.';
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists verification_items_require_ein_match on public.verification_items;
create trigger verification_items_require_ein_match
before update of status on public.verification_items
for each row execute function public.enforce_ein_match_before_review();

drop function if exists public.list_admin_verification_queue(
    uuid, public.verification_item_status, public.verification_item_type, uuid, integer
);

create function public.list_admin_verification_queue(
    p_actor_user_id uuid,
    p_status public.verification_item_status default null,
    p_item_type public.verification_item_type default null,
    p_organization_id uuid default null,
    p_limit integer default 50
)
returns table (
    verification_case_id uuid, verification_item_id uuid, organization_id uuid,
    organization_name text, business_id uuid, business_legal_name text,
    item_type public.verification_item_type, item_status public.verification_item_status,
    verification_method public.verification_method, case_created_at timestamptz,
    case_submitted_at timestamptz, item_created_at timestamptz,
    item_updated_at timestamptz, item_reviewed_at timestamptz,
    ein_check_state text, ein_check_mode text, ein_last_checked_at timestamptz,
    ein_safe_reason text, ein_response_code text, ein_provider_reference text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    if p_actor_user_id is null or not exists (
        select 1 from auth.users where id = p_actor_user_id
    ) or not exists (
        select 1 from public.user_platform_roles
        where user_id = p_actor_user_id and role = 'admin'::public.platform_role
    ) then
        raise insufficient_privilege using message = 'Platform administrator permission is required.';
    end if;
    if p_limit is null or p_limit < 1 or p_limit > 100 then
        raise invalid_parameter_value using message = 'Queue limit must be between 1 and 100.';
    end if;

    return query
    select vc.id, vi.id, o.id, o.name, b.id, b.legal_name,
        vi.item_type, vi.status, vi.verification_method, vc.created_at,
        vc.submitted_at, vi.created_at, vi.updated_at, vi.reviewed_at,
        case
            when vi.item_type <> 'ein' or ev.id is null then 'not_checked'
            when ev.completed_at is null then 'checking'
            when ev.result_status = 'match' then 'match'
            when ev.result_status in ('invalid_tin', 'tin_not_issued', 'name_mismatch') then 'no_match'
            when ev.result_status = 'manual_review' then 'manual_review'
            when ev.result_status in ('invalid_request', 'reuse_existing', 'pending') then 'incomplete'
            else 'unavailable'
        end,
        ev.provider_mode, ev.completed_at, ev.result_reason,
        ev.response_code, ev.provider_reference
    from public.verification_items vi
    join public.verification_cases vc on vc.id = vi.verification_case_id
    join public.organizations o on o.id = vc.organization_id
    join public.businesses b on b.id = vc.business_id and b.organization_id = vc.organization_id
    left join lateral (
        select attempt.id, attempt.provider_mode, attempt.completed_at,
               attempt.result_status, attempt.result_reason,
               attempt.response_code, attempt.provider_reference
        from public.ein_verifications attempt
        where attempt.verification_item_id = vi.id
          and attempt.requested_at >= b.ein_identity_updated_at
        order by attempt.requested_at desc, attempt.id desc limit 1
    ) ev on true
    where ((p_status is null and vi.status in ('pending', 'in_review',
        'verification_requested', 'correction_required')) or vi.status = p_status)
      and (p_item_type is null or vi.item_type = p_item_type)
      and (p_organization_id is null or vc.organization_id = p_organization_id)
    order by vi.updated_at asc, vi.id asc limit p_limit;
end;
$$;

revoke all on function public.list_admin_verification_queue(
    uuid, public.verification_item_status, public.verification_item_type, uuid, integer
) from public, anon, authenticated;
grant execute on function public.list_admin_verification_queue(
    uuid, public.verification_item_status, public.verification_item_type, uuid, integer
) to service_role;

commit;
