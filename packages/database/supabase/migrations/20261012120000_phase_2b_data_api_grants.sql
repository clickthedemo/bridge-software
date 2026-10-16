begin;

-- PostgREST still requires table privileges before row-level security policies
-- are evaluated. Keep authenticated access limited to the Phase 2B resources
-- and operations that already have tenant/self-scoped RLS policies.
grant usage on schema public to authenticated, service_role;

grant select on table public.user_profiles to authenticated;
grant update (display_name, phone) on table public.user_profiles to authenticated;

grant select on table public.organizations to authenticated;
grant update (name, organization_type) on table public.organizations to authenticated;

grant select on table public.organization_members to authenticated;
grant select on table public.user_platform_roles to authenticated;

grant select, insert, update on table public.businesses to authenticated;

-- The backend's trusted administrative client receives only the operations
-- required by Phase 2B counts and the existing administrator invitation flow.
-- No equivalent grants are made to anon.
grant select, update on table public.user_profiles to service_role;
grant select on table public.organizations to service_role;
grant select on table public.organization_members to service_role;
grant select on table public.businesses to service_role;
grant select on table public.directory_profiles to service_role;
grant select, insert, update on table public.user_platform_roles to service_role;
grant select, insert on table public.audit_logs to service_role;

commit;
