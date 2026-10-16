-- Phase 2C closure: supported tenant membership management and complete
-- Directory submission readiness. All mutations enforce tenant authority in
-- the database even when the API middleware has already authorized the call.

create or replace function public.list_organization_members(p_organization_id uuid)
returns table(
    membership_id uuid,
    user_id uuid,
    email text,
    display_name text,
    role public.organization_role,
    status public.membership_status,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
    if auth.uid() is null or not public.has_organization_role(
        p_organization_id,
        array['owner'::public.organization_role, 'admin'::public.organization_role]
    ) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;

    return query
    select om.id, om.user_id, lower(au.email), up.display_name,
           om.role, om.status, om.created_at, om.updated_at
    from public.organization_members om
    join auth.users au on au.id = om.user_id
    left join public.user_profiles up on up.id = om.user_id
    where om.organization_id = p_organization_id
      and om.status <> 'removed'::public.membership_status
    order by om.created_at, om.id;
end;
$$;

create or replace function public.assign_organization_member(
    p_organization_id uuid,
    p_target_user_id uuid,
    p_role public.organization_role
)
returns table(
    membership_id uuid,
    user_id uuid,
    role public.organization_role,
    status public.membership_status,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid := auth.uid();
    existing public.organization_members%rowtype;
    result public.organization_members%rowtype;
    audit_action public.audit_action;
begin
    if actor_id is null or not public.has_organization_role(
        p_organization_id,
        array['owner'::public.organization_role, 'admin'::public.organization_role]
    ) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;

    if p_role not in (
        'admin'::public.organization_role,
        'page_manager'::public.organization_role,
        'member'::public.organization_role
    ) then
        raise check_violation using message = 'The requested organization role cannot be assigned here.';
    end if;

    if not exists (select 1 from auth.users where id = p_target_user_id) then
        raise no_data_found using message = 'Target user not found.';
    end if;

    select om.* into existing
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = p_target_user_id
    for update;

    insert into public.organization_members (organization_id, user_id, role, status)
    values (p_organization_id, p_target_user_id, p_role, 'active'::public.membership_status)
    on conflict (organization_id, user_id) do update
    set role = excluded.role,
        status = 'active'::public.membership_status,
        updated_at = timezone('utc', now())
    returning * into result;

    audit_action := case when existing.id is null then 'create'::public.audit_action else 'update'::public.audit_action end;
    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (
        p_organization_id,
        actor_id,
        audit_action,
        'organization_membership',
        result.id,
        jsonb_build_object(
            'target_user_id', p_target_user_id,
            'previous_role', existing.role,
            'new_role', result.role,
            'previous_status', existing.status,
            'new_status', result.status
        )
    );

    return query select result.id, result.user_id, result.role, result.status, result.created_at, result.updated_at;
end;
$$;

create or replace function public.remove_organization_member(
    p_organization_id uuid,
    p_membership_id uuid
)
returns table(
    membership_id uuid,
    user_id uuid,
    role public.organization_role,
    status public.membership_status,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid := auth.uid();
    target public.organization_members%rowtype;
    result public.organization_members%rowtype;
    active_owner_count integer;
begin
    if actor_id is null or not public.has_organization_role(
        p_organization_id,
        array['owner'::public.organization_role, 'admin'::public.organization_role]
    ) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;

    select om.* into target
    from public.organization_members om
    where om.id = p_membership_id
      and om.organization_id = p_organization_id
    for update;

    if not found then
        raise no_data_found using message = 'Organization membership not found.';
    end if;

    if target.role = 'owner'::public.organization_role and target.status = 'active'::public.membership_status then
        select count(*) into active_owner_count
        from public.organization_members om
        where om.organization_id = p_organization_id
          and om.role = 'owner'::public.organization_role
          and om.status = 'active'::public.membership_status;
        if active_owner_count <= 1 then
            raise object_not_in_prerequisite_state using message = 'The final organization owner cannot be removed.';
        end if;
    end if;

    update public.organization_members om
    set status = 'removed'::public.membership_status,
        updated_at = timezone('utc', now())
    where om.id = target.id
    returning * into result;

    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (
        p_organization_id,
        actor_id,
        'delete'::public.audit_action,
        'organization_membership',
        result.id,
        jsonb_build_object('target_user_id', result.user_id, 'role', result.role, 'previous_status', target.status, 'new_status', result.status)
    );

    return query select result.id, result.user_id, result.role, result.status, result.created_at, result.updated_at;
end;
$$;

create or replace function public.get_directory_profile_submission_missing_fields(p_organization_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
    profile public.directory_profiles%rowtype;
    business public.businesses%rowtype;
    organization public.organizations%rowtype;
    missing text[] := array[]::text[];
begin
    if auth.uid() is null or not public.is_organization_admin(p_organization_id) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;

    select dp.* into profile from public.directory_profiles dp where dp.organization_id = p_organization_id;
    if not found then raise no_data_found using message = 'Directory profile not found.'; end if;
    select b.* into business from public.businesses b where b.id = profile.business_id and b.organization_id = p_organization_id;
    if not found then missing := array_append(missing, 'business'); return missing; end if;
    select o.* into organization from public.organizations o where o.id = p_organization_id;

    if nullif(btrim(business.legal_name), '') is null then missing := array_append(missing, 'legal_business_name'); end if;
    if business.dba_name is not null and nullif(btrim(business.dba_name), '') is null then missing := array_append(missing, 'dba_name'); end if;
    if not public.is_business_ein_verified(business.id) then missing := array_append(missing, 'ein_verification'); end if;
    if not exists (
        select 1 from public.organization_locations location
        where location.organization_id = p_organization_id
          and location.is_primary
          and nullif(btrim(location.address_line_1), '') is not null
          and nullif(btrim(location.city), '') is not null
          and nullif(btrim(location.postal_code), '') is not null
          and nullif(btrim(location.country), '') is not null
    ) then missing := array_append(missing, 'business_address'); end if;
    if nullif(btrim(profile.public_phone), '') is null then missing := array_append(missing, 'phone'); end if;
    if nullif(btrim(profile.public_email), '') is null then missing := array_append(missing, 'email'); end if;
    if not exists (
        select 1 from public.directory_profile_links link
        where link.profile_id = profile.id
          and link.link_type = 'website'::public.directory_profile_link_type
          and nullif(btrim(link.url), '') is not null
    ) then missing := array_append(missing, 'website_url'); end if;
    if organization.organization_type is null or profile.business_type is distinct from organization.organization_type then missing := array_append(missing, 'organization_type'); end if;
    if organization.organization_type in ('retailer'::public.organization_type, 'dispensary'::public.organization_type)
       and (nullif(btrim(coalesce(profile.license_type, '')), '') is null
            or nullif(btrim(coalesce(profile.license_number, business.cannabis_license_number, '')), '') is null) then
        missing := array_append(missing, 'license_information');
    end if;
    if nullif(btrim(profile.slug), '') is null then missing := array_append(missing, 'profile_slug'); end if;
    if nullif(btrim(profile.display_name), '') is null then missing := array_append(missing, 'profile_display_name'); end if;
    return missing;
end;
$$;

create or replace function public.submit_directory_profile(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid := auth.uid();
    target_profile public.directory_profiles%rowtype;
    submission_time timestamptz := timezone('utc', now());
    history_action public.directory_profile_history_action;
    missing_fields text[];
begin
    if actor_id is null or not public.is_organization_admin(p_organization_id) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;
    select dp.* into target_profile from public.directory_profiles dp where dp.organization_id = p_organization_id for update;
    if not found then raise no_data_found using message = 'Directory profile not found.'; end if;
    if target_profile.status not in ('draft'::public.directory_profile_status, 'correction_requested'::public.directory_profile_status) then
        raise object_not_in_prerequisite_state using message = 'Directory profile cannot be submitted from its current status.';
    end if;
    missing_fields := public.get_directory_profile_submission_missing_fields(p_organization_id);
    if cardinality(missing_fields) > 0 then
        raise check_violation using message = 'Directory profile or business record is incomplete.', detail = array_to_string(missing_fields, ',');
    end if;
    history_action := case target_profile.status when 'correction_requested'::public.directory_profile_status then 'resubmitted'::public.directory_profile_history_action else 'submitted'::public.directory_profile_history_action end;
    update public.directory_profiles set status = 'pending_review'::public.directory_profile_status, submitted_by_user_id = actor_id, submitted_at = submission_time, reviewed_by_user_id = null, reviewed_at = null, updated_by_user_id = actor_id where id = target_profile.id;
    insert into public.directory_profile_history (profile_id, organization_id, actor_user_id, action, previous_status, new_status, reason)
    values (target_profile.id, p_organization_id, actor_id, history_action, target_profile.status, 'pending_review'::public.directory_profile_status, target_profile.workflow_reason);
    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (p_organization_id, actor_id, 'submit'::public.audit_action, 'directory_profile', target_profile.id, jsonb_build_object('workflow_action', history_action, 'published_version_preserved', target_profile.published_version_id is not null));
end;
$$;

revoke all on function public.list_organization_members(uuid) from public, anon, authenticated;
revoke all on function public.assign_organization_member(uuid, uuid, public.organization_role) from public, anon, authenticated;
revoke all on function public.remove_organization_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.get_directory_profile_submission_missing_fields(uuid) from public, anon, authenticated;
revoke all on function public.submit_directory_profile(uuid) from public, anon, authenticated;
grant execute on function public.list_organization_members(uuid) to authenticated;
grant execute on function public.assign_organization_member(uuid, uuid, public.organization_role) to authenticated;
grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
grant execute on function public.get_directory_profile_submission_missing_fields(uuid) to authenticated;
grant execute on function public.submit_directory_profile(uuid) to authenticated;
