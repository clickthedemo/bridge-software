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
    if p_role not in ('admin'::public.organization_role, 'page_manager'::public.organization_role, 'member'::public.organization_role) then
        raise check_violation using message = 'The requested organization role cannot be assigned here.';
    end if;
    if not exists (select 1 from auth.users au where au.id = p_target_user_id) then
        raise no_data_found using message = 'Target user not found.';
    end if;

    select om.* into existing
    from public.organization_members om
    where om.organization_id = p_organization_id and om.user_id = p_target_user_id
    for update;

    insert into public.organization_members (organization_id, user_id, role, status)
    values (p_organization_id, p_target_user_id, p_role, 'active'::public.membership_status)
    on conflict on constraint organization_members_organization_user_unique do update
    set role = excluded.role,
        status = 'active'::public.membership_status,
        updated_at = timezone('utc', now())
    returning * into result;

    audit_action := case when existing.id is null then 'create'::public.audit_action else 'update'::public.audit_action end;
    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (p_organization_id, actor_id, audit_action, 'organization_membership', result.id,
        jsonb_build_object('target_user_id', p_target_user_id, 'previous_role', existing.role, 'new_role', result.role, 'previous_status', existing.status, 'new_status', result.status));
    return query select result.id, result.user_id, result.role, result.status, result.created_at, result.updated_at;
end;
$$;

revoke all on function public.assign_organization_member(uuid, uuid, public.organization_role) from public, anon, authenticated;
grant execute on function public.assign_organization_member(uuid, uuid, public.organization_role) to authenticated;
