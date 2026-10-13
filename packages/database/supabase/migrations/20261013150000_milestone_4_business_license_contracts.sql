begin;

alter table public.businesses
    add column website_url text,
    add column employee_count integer,
    add constraint businesses_website_https check (website_url is null or website_url ~ '^https://[^[:space:]]+$'),
    add constraint businesses_employee_count_bounds check (employee_count is null or employee_count between 1 and 1000000);

create type public.business_license_type as enum ('medical', 'adult_use', 'dual');
create type public.business_license_status as enum ('pending', 'verified', 'rejected', 'expired', 'suspended');

create table public.business_licenses (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete restrict,
    license_number text not null,
    license_type public.business_license_type not null,
    issuing_state text not null,
    expires_on date not null,
    status public.business_license_status not null default 'pending',
    verified_at timestamptz,
    verified_by uuid references auth.users(id) on delete set null,
    review_reason text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint business_licenses_business_unique unique (business_id),
    constraint business_licenses_number_present check (nullif(btrim(license_number), '') is not null),
    constraint business_licenses_state_format check (issuing_state ~ '^[A-Z]{2}$'),
    constraint business_licenses_review_reason check (status not in ('rejected', 'suspended') or nullif(btrim(review_reason), '') is not null)
);

create index business_licenses_organization_idx on public.business_licenses(organization_id);
create index business_licenses_status_idx on public.business_licenses(status);
create trigger business_licenses_set_updated_at before update on public.business_licenses
for each row execute function public.set_updated_at();
alter table public.business_licenses enable row level security;

create policy business_licenses_select_member on public.business_licenses for select to authenticated
using (public.is_organization_member(organization_id));

create or replace function public.update_business_details(
    p_organization_id uuid, p_business_id uuid, p_website_url text, p_employee_count integer
)
returns table(business_id uuid, website_url text, employee_count integer, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); target public.businesses%rowtype;
begin
    if actor_id is null or not public.is_organization_admin(p_organization_id) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;
    if p_website_url !~ '^https://[^[:space:]]+$' or p_employee_count not between 1 and 1000000 then
        raise check_violation using message = 'Business website and employee count are invalid.';
    end if;
    update public.businesses b set website_url = p_website_url, employee_count = p_employee_count,
        updated_at = timezone('utc', now())
    where b.id = p_business_id and b.organization_id = p_organization_id returning * into target;
    if not found then raise no_data_found using message = 'Business not found.'; end if;
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(p_organization_id, actor_id, 'update', 'business', target.id,
        jsonb_build_object('website_changed', true, 'employee_count_changed', true));
    return query select target.id, target.website_url, target.employee_count, target.updated_at;
end;
$$;

create or replace function public.put_business_license(
    p_organization_id uuid, p_business_id uuid, p_license_number text,
    p_license_type public.business_license_type, p_issuing_state text, p_expires_on date
)
returns public.business_licenses
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); result public.business_licenses%rowtype;
begin
    if actor_id is null or not public.is_organization_admin(p_organization_id) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;
    if not exists(select 1 from public.businesses b where b.id=p_business_id and b.organization_id=p_organization_id) then
        raise no_data_found using message = 'Business not found.';
    end if;
    insert into public.business_licenses(business_id, organization_id, license_number, license_type, issuing_state, expires_on)
    values(p_business_id, p_organization_id, btrim(p_license_number), p_license_type, upper(btrim(p_issuing_state)), p_expires_on)
    on conflict (business_id) do update set license_number=excluded.license_number, license_type=excluded.license_type,
        issuing_state=excluded.issuing_state, expires_on=excluded.expires_on, status='pending', verified_at=null,
        verified_by=null, review_reason=null, updated_at=timezone('utc', now()) returning * into result;
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(p_organization_id, actor_id, 'update', 'business_license', result.id,
        jsonb_build_object('status', result.status, 'business_id', p_business_id));
    return result;
end;
$$;

create or replace function public.list_admin_business_licenses(
    p_actor_user_id uuid, p_status public.business_license_status default null
)
returns setof public.business_licenses
language plpgsql security definer set search_path = '' as $$
begin
    if not exists(select 1 from public.user_platform_roles where user_id=p_actor_user_id and role='admin') then
        raise insufficient_privilege using message='Bridge administrator permission is required.';
    end if;
    return query select bl.* from public.business_licenses bl
    where p_status is null or bl.status=p_status order by bl.created_at asc;
end;
$$;

create or replace function public.review_business_license(
    p_actor_user_id uuid, p_license_id uuid, p_action text, p_reason text default null
)
returns public.business_licenses
language plpgsql security definer set search_path = '' as $$
declare target public.business_licenses%rowtype; next_status public.business_license_status;
begin
    if not exists(select 1 from public.user_platform_roles where user_id=p_actor_user_id and role='admin') then
        raise insufficient_privilege using message='Bridge administrator permission is required.';
    end if;
    select * into target from public.business_licenses where id=p_license_id for update;
    if not found then raise no_data_found using message='Business licence not found.'; end if;
    if exists(select 1 from public.organization_members where organization_id=target.organization_id and user_id=p_actor_user_id and status='active') then
        raise insufficient_privilege using message='Administrators cannot review their own organization.';
    end if;
    if p_action not in ('verified','correction_required','rejected','suspended') then
        raise check_violation using message='Invalid licence review action.';
    end if;
    if p_action <> 'verified' and nullif(btrim(p_reason),'') is null then
        raise check_violation using message='A review reason is required.';
    end if;
    next_status := case p_action when 'verified' then 'verified'::public.business_license_status
        when 'rejected' then 'rejected'::public.business_license_status
        when 'suspended' then 'suspended'::public.business_license_status else 'pending'::public.business_license_status end;
    update public.business_licenses set status=next_status,
        verified_at=case when next_status='verified' then timezone('utc',now()) else null end,
        verified_by=case when next_status='verified' then p_actor_user_id else null end,
        review_reason=case when p_action='verified' then null else btrim(p_reason) end
    where id=p_license_id returning * into target;
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(target.organization_id, p_actor_user_id,
        case p_action when 'verified' then 'approve'::public.audit_action when 'correction_required' then 'request_correction'::public.audit_action else 'reject'::public.audit_action end,
        'business_license', target.id, jsonb_build_object('review_action',p_action,'status',target.status));
    return target;
end;
$$;

create or replace function public.get_directory_profile_submission_missing_fields(p_organization_id uuid)
returns text[] language plpgsql security definer set search_path = '' as $$
declare profile public.directory_profiles%rowtype; business public.businesses%rowtype; organization public.organizations%rowtype; license public.business_licenses%rowtype; missing text[] := array[]::text[];
begin
    if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise insufficient_privilege using message='Organization owner or admin permission is required.'; end if;
    select dp.* into profile from public.directory_profiles dp where dp.organization_id=p_organization_id;
    if not found then raise no_data_found using message='Directory profile not found.'; end if;
    select b.* into business from public.businesses b where b.id=profile.business_id and b.organization_id=p_organization_id;
    if not found then return array['business']; end if;
    select o.* into organization from public.organizations o where o.id=p_organization_id;
    if nullif(btrim(business.legal_name),'') is null then missing:=array_append(missing,'legal_business_name'); end if;
    if nullif(btrim(business.website_url),'') is null then missing:=array_append(missing,'business_website'); end if;
    if business.employee_count is null or business.employee_count < 1 then missing:=array_append(missing,'employee_count'); end if;
    if nullif(btrim(business.contact_email),'') is null then missing:=array_append(missing,'private_email'); end if;
    if nullif(btrim(business.contact_phone),'') is null then missing:=array_append(missing,'private_phone'); end if;
    if not public.is_business_ein_verified(business.id) then missing:=array_append(missing,'ein_verification'); end if;
    if not exists(select 1 from public.organization_locations l where l.organization_id=p_organization_id and l.is_primary and nullif(btrim(l.address_line_1),'') is not null and nullif(btrim(l.city),'') is not null and nullif(btrim(l.postal_code),'') is not null and nullif(btrim(l.country),'') is not null) then missing:=array_append(missing,'business_address'); end if;
    if organization.organization_type is null or profile.business_type is distinct from organization.organization_type then missing:=array_append(missing,'organization_type'); end if;
    if nullif(btrim(profile.slug),'') is null then missing:=array_append(missing,'profile_slug'); end if;
    if nullif(btrim(profile.display_name),'') is null then missing:=array_append(missing,'profile_display_name'); end if;
    if organization.organization_type in ('retailer','dispensary') then
        select bl.* into license from public.business_licenses bl where bl.business_id=business.id;
        if not found then missing:=array_append(missing,'business_license');
        else
            if license.status <> 'verified' then missing:=array_append(missing,'license_verified'); end if;
            if license.expires_on <= current_date then missing:=array_append(missing,'license_expiration'); end if;
        end if;
    end if;
    return missing;
end;
$$;

revoke all on function public.update_business_details(uuid,uuid,text,integer) from public,anon;
revoke all on function public.put_business_license(uuid,uuid,text,public.business_license_type,text,date) from public,anon;
revoke all on function public.list_admin_business_licenses(uuid,public.business_license_status) from public,anon,authenticated;
revoke all on function public.review_business_license(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.update_business_details(uuid,uuid,text,integer) to authenticated;
grant execute on function public.put_business_license(uuid,uuid,text,public.business_license_type,text,date) to authenticated;
grant execute on function public.list_admin_business_licenses(uuid,public.business_license_status) to service_role;
grant execute on function public.review_business_license(uuid,uuid,text,text) to service_role;
grant select on public.business_licenses to service_role;

commit;
