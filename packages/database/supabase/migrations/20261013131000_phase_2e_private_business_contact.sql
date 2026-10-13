begin;

alter table public.businesses
    add column contact_email text,
    add column contact_phone text,
    add constraint businesses_contact_email_length check (contact_email is null or char_length(contact_email) between 3 and 320),
    add constraint businesses_contact_phone_length check (contact_phone is null or char_length(contact_phone) between 7 and 32);

create or replace function public.put_business_contact(
    p_organization_id uuid, p_business_id uuid, p_email text, p_phone text
)
returns table(business_id uuid, contact_email text, contact_phone text, updated_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid := auth.uid(); target public.businesses%rowtype;
begin
    if actor_id is null or not public.is_organization_admin(p_organization_id) then
        raise insufficient_privilege using message = 'Organization owner or admin permission is required.';
    end if;
    if nullif(btrim(p_email), '') is null or nullif(btrim(p_phone), '') is null then
        raise check_violation using message = 'Business email and phone are required.';
    end if;
    update public.businesses b set contact_email = lower(btrim(p_email)), contact_phone = btrim(p_phone), updated_at = timezone('utc', now())
    where b.id = p_business_id and b.organization_id = p_organization_id returning * into target;
    if not found then raise no_data_found using message = 'Business not found.'; end if;
    insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
    values(p_organization_id, actor_id, 'update', 'business_contact', target.id, jsonb_build_object('contact_completed', true));
    return query select target.id, target.contact_email, target.contact_phone, target.updated_at;
end;
$$;

revoke all on function public.put_business_contact(uuid, uuid, text, text) from public, anon;
grant execute on function public.put_business_contact(uuid, uuid, text, text) to authenticated;

create or replace function public.get_directory_profile_submission_missing_fields(p_organization_id uuid)
returns text[] language plpgsql security definer set search_path = '' as $$
declare profile public.directory_profiles%rowtype; business public.businesses%rowtype; organization public.organizations%rowtype; missing text[] := array[]::text[];
begin
    if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise insufficient_privilege using message = 'Organization owner or admin permission is required.'; end if;
    select dp.* into profile from public.directory_profiles dp where dp.organization_id = p_organization_id;
    if not found then raise no_data_found using message = 'Directory profile not found.'; end if;
    select b.* into business from public.businesses b where b.id = profile.business_id and b.organization_id = p_organization_id;
    if not found then missing := array_append(missing, 'business'); return missing; end if;
    select o.* into organization from public.organizations o where o.id = p_organization_id;
    if nullif(btrim(business.legal_name), '') is null then missing := array_append(missing, 'legal_business_name'); end if;
    if business.dba_name is not null and nullif(btrim(business.dba_name), '') is null then missing := array_append(missing, 'dba_name'); end if;
    if not public.is_business_ein_verified(business.id) then missing := array_append(missing, 'ein_verification'); end if;
    if not exists(select 1 from public.organization_locations location where location.organization_id = p_organization_id and location.is_primary and nullif(btrim(location.address_line_1), '') is not null and nullif(btrim(location.city), '') is not null and nullif(btrim(location.postal_code), '') is not null and nullif(btrim(location.country), '') is not null) then missing := array_append(missing, 'business_address'); end if;
    if nullif(btrim(business.contact_phone), '') is null then missing := array_append(missing, 'phone'); end if;
    if nullif(btrim(business.contact_email), '') is null then missing := array_append(missing, 'email'); end if;
    if not exists(select 1 from public.directory_profile_links link where link.profile_id = profile.id and link.link_type = 'website'::public.directory_profile_link_type and nullif(btrim(link.url), '') is not null) then missing := array_append(missing, 'website_url'); end if;
    if organization.organization_type is null or profile.business_type is distinct from organization.organization_type then missing := array_append(missing, 'organization_type'); end if;
    if organization.organization_type in ('retailer'::public.organization_type, 'dispensary'::public.organization_type) and (nullif(btrim(coalesce(profile.license_type, '')), '') is null or nullif(btrim(coalesce(profile.license_number, business.cannabis_license_number, '')), '') is null) then missing := array_append(missing, 'license_information'); end if;
    if nullif(btrim(profile.slug), '') is null then missing := array_append(missing, 'profile_slug'); end if;
    if nullif(btrim(profile.display_name), '') is null then missing := array_append(missing, 'profile_display_name'); end if;
    return missing;
end;
$$;

commit;
