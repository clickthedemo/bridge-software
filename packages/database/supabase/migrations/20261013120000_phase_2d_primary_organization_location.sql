begin;

create unique index if not exists organization_locations_one_primary_idx
on public.organization_locations (organization_id)
where is_primary;

create or replace function public.put_primary_organization_location(
    p_organization_id uuid,
    p_address_line_1 text,
    p_address_line_2 text,
    p_city text,
    p_state text,
    p_postal_code text,
    p_country text
)
returns table(
    location_id uuid,
    organization_id uuid,
    address_line_1 text,
    address_line_2 text,
    city text,
    state text,
    postal_code text,
    country text,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
    actor_id uuid := auth.uid();
    target public.organization_locations%rowtype;
    audit_action public.audit_action;
begin
    if actor_id is null or not public.has_organization_role(
        p_organization_id,
        array['owner'::public.organization_role, 'admin'::public.organization_role]
    ) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;

    if nullif(btrim(p_address_line_1), '') is null
       or nullif(btrim(p_city), '') is null
       or nullif(btrim(p_country), '') is null then
        raise check_violation using message = 'A complete primary address is required.';
    end if;

    select ol.* into target
    from public.organization_locations ol
    where ol.organization_id = p_organization_id and ol.is_primary
    for update;

    audit_action := case when target.id is null then 'create'::public.audit_action else 'update'::public.audit_action end;

    if target.id is null then
        insert into public.organization_locations(
            organization_id, location_type, address_line_1, address_line_2,
            city, state, postal_code, country, is_primary
        ) values (
            p_organization_id, 'primary'::public.organization_location_type,
            btrim(p_address_line_1), nullif(btrim(p_address_line_2), ''),
            btrim(p_city), nullif(btrim(p_state), ''), nullif(btrim(p_postal_code), ''),
            upper(btrim(p_country)), true
        ) returning * into target;
    else
        update public.organization_locations ol set
            location_type = 'primary'::public.organization_location_type,
            address_line_1 = btrim(p_address_line_1),
            address_line_2 = nullif(btrim(p_address_line_2), ''),
            city = btrim(p_city), state = nullif(btrim(p_state), ''),
            postal_code = nullif(btrim(p_postal_code), ''), country = upper(btrim(p_country)),
            updated_at = timezone('utc', now())
        where ol.id = target.id returning * into target;
    end if;

    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values (p_organization_id, actor_id, audit_action, 'organization_location', target.id,
        jsonb_build_object('location_type', 'primary'));

    return query select target.id, target.organization_id, target.address_line_1,
        target.address_line_2, target.city, target.state, target.postal_code,
        target.country, target.updated_at;
end;
$$;

revoke all on function public.put_primary_organization_location(uuid,text,text,text,text,text,text)
from public, anon;
grant execute on function public.put_primary_organization_location(uuid,text,text,text,text,text,text)
to authenticated;

commit;
