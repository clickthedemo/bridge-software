begin;

-- Working revisions must not replace the immutable public snapshot, but an
-- already-approved snapshot remains public until a replacement is approved.
do $$
declare definition text;
begin
    select pg_get_functiondef(
        'public.list_public_directory_profiles(text, public.organization_type, text, text, text, text, boolean, text, text, text, integer)'::regprocedure
    ) into definition;
    definition := replace(
        definition,
        'p.status = ''approved''::public.directory_profile_status',
        'p.status <> ''suspended''::public.directory_profile_status'
    );
    if definition not like '%p.status <> ''suspended''::public.directory_profile_status%' then
        raise exception 'Could not preserve the approved Directory snapshot';
    end if;
    execute definition;
end;
$$;

create or replace function public.get_public_directory_profile(p_slug text)
returns table(
    slug text, display_name text, summary text, story text,
    business_type public.organization_type, categories jsonb,
    city text, state text, region text, public_email text, public_phone text,
    license_type text, license_number text, links jsonb,
    legal_name text, dba_name text, business_name text,
    verified boolean, has_logo boolean
)
language sql stable security definer set search_path = '' as $$
select v.slug, v.display_name, v.summary, v.story, v.business_type,
    coalesce((select jsonb_agg(c.category order by c.sort_order) from public.directory_profile_version_categories c where c.version_id = v.id), '[]'::jsonb),
    v.city, v.state, v.region, v.public_email, v.public_phone, v.license_type, v.license_number,
    coalesce((select jsonb_agg(jsonb_build_object('type', l.link_type, 'label', l.label, 'url', l.url, 'sortOrder', l.sort_order) order by l.sort_order) from public.directory_profile_version_links l where l.version_id = v.id), '[]'::jsonb),
    v.legal_name, v.dba_name, coalesce(v.dba_name, v.legal_name), true, v.logo_storage_path is not null
from public.directory_profiles p
join public.directory_profile_versions v on v.id = p.published_version_id and v.profile_id = p.id and v.is_published
join public.organizations o on o.id = p.organization_id
join public.businesses b on b.id = v.business_id and b.organization_id = p.organization_id
where v.slug = lower(btrim(p_slug))
  and p.status <> 'suspended'::public.directory_profile_status
  and o.status = 'active'::public.organization_status
  and b.status = 'active'::public.business_status
  and public.is_business_ein_verified(b.id)
limit 1;
$$;

revoke all on function public.get_public_directory_profile(text) from public;
grant execute on function public.get_public_directory_profile(text) to anon, authenticated, service_role;

commit;
