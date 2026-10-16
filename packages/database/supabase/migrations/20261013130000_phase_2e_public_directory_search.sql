begin;

create index if not exists directory_profile_versions_published_name_cursor_idx
on public.directory_profile_versions(lower(display_name), lower(slug))
where is_published;

create or replace function public.list_public_directory_profiles(
    p_query text default null, p_organization_type public.organization_type default null,
    p_category text default null, p_state text default null, p_city text default null,
    p_region text default null, p_verified boolean default null,
    p_sort text default 'name_asc', p_cursor_name text default null,
    p_cursor_slug text default null, p_limit integer default 21
)
returns table(
    slug text, display_name text, summary text, story text,
    business_type public.organization_type, categories jsonb,
    city text, state text, region text, public_email text, public_phone text,
    license_type text, license_number text, links jsonb,
    legal_name text, dba_name text, business_name text,
    verified boolean, has_logo boolean, cursor_name text
)
language plpgsql stable security definer set search_path = '' as $$
declare
    normalized text := nullif(btrim(p_query), '');
    normalized_category text := nullif(btrim(p_category), '');
    normalized_state text := nullif(btrim(p_state), '');
    normalized_city text := nullif(btrim(p_city), '');
    normalized_region text := nullif(btrim(p_region), '');
    escaped text;
begin
    if p_sort not in ('name_asc', 'name_desc') then raise invalid_parameter_value using message = 'Unsupported Directory sort.'; end if;
    if p_limit < 1 or p_limit > 51 then raise invalid_parameter_value using message = 'Directory page limit is invalid.'; end if;
    if length(normalized) > 100 or length(normalized_category) > 100
       or length(normalized_state) > 100 or length(normalized_city) > 100
       or length(normalized_region) > 100 then
        raise invalid_parameter_value using message = 'Directory filter is too long.';
    end if;
    if (p_cursor_name is null) <> (p_cursor_slug is null) then
        raise invalid_parameter_value using message = 'Directory cursor is incomplete.';
    end if;
    if p_verified = false then return; end if;
    escaped := replace(replace(replace(normalized, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_');

    return query
    select v.slug, v.display_name, v.summary, v.story, v.business_type,
        coalesce((select jsonb_agg(c.category order by c.sort_order)
            from public.directory_profile_version_categories c where c.version_id = v.id), '[]'::jsonb),
        v.city, v.state, v.region, v.public_email, v.public_phone, v.license_type, v.license_number,
        coalesce((select jsonb_agg(jsonb_build_object('type', l.link_type, 'label', l.label, 'url', l.url, 'sortOrder', l.sort_order) order by l.sort_order)
            from public.directory_profile_version_links l where l.version_id = v.id), '[]'::jsonb),
        v.legal_name, v.dba_name, coalesce(v.dba_name, v.legal_name), true,
        v.logo_storage_path is not null, lower(v.display_name)
    from public.directory_profiles p
    join public.directory_profile_versions v on v.id = p.published_version_id and v.profile_id = p.id and v.is_published
    join public.organizations o on o.id = p.organization_id
    join public.businesses b on b.id = v.business_id and b.organization_id = p.organization_id
    where p.status <> 'suspended'::public.directory_profile_status
      and o.status = 'active'::public.organization_status
      and b.status = 'active'::public.business_status
      and public.is_business_ein_verified(b.id)
      and (p_organization_type is null or v.business_type = p_organization_type)
      and (normalized_category is null or exists(select 1 from public.directory_profile_version_categories c where c.version_id = v.id and lower(c.category) = lower(normalized_category)))
      and (normalized_state is null or lower(v.state) = lower(normalized_state))
      and (normalized_city is null or lower(v.city) = lower(normalized_city))
      and (normalized_region is null or lower(v.region) = lower(normalized_region))
      and (normalized is null
          or v.display_name ilike '%' || escaped || '%' escape E'\\'
          or coalesce(v.summary, '') ilike '%' || escaped || '%' escape E'\\'
          or coalesce(v.story, '') ilike '%' || escaped || '%' escape E'\\'
          or v.legal_name ilike '%' || escaped || '%' escape E'\\'
          or coalesce(v.dba_name, '') ilike '%' || escaped || '%' escape E'\\'
          or coalesce(v.city, '') ilike '%' || escaped || '%' escape E'\\'
          or coalesce(v.state, '') ilike '%' || escaped || '%' escape E'\\'
          or exists(select 1 from public.directory_profile_version_categories c where c.version_id = v.id and c.category ilike '%' || escaped || '%' escape E'\\'))
      and (p_cursor_name is null
          or (p_sort = 'name_asc' and (lower(v.display_name), lower(v.slug)) > (p_cursor_name, p_cursor_slug))
          or (p_sort = 'name_desc' and (lower(v.display_name), lower(v.slug)) < (p_cursor_name, p_cursor_slug)))
    order by case when p_sort = 'name_asc' then lower(v.display_name) end asc,
        case when p_sort = 'name_asc' then lower(v.slug) end asc,
        case when p_sort = 'name_desc' then lower(v.display_name) end desc,
        case when p_sort = 'name_desc' then lower(v.slug) end desc
    limit p_limit;
end;
$$;

revoke all on function public.list_public_directory_profiles(text, public.organization_type, text, text, text, text, boolean, text, text, text, integer) from public;
grant execute on function public.list_public_directory_profiles(text, public.organization_type, text, text, text, text, boolean, text, text, text, integer) to anon, authenticated, service_role;

commit;
