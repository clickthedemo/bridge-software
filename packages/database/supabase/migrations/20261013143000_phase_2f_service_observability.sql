begin;

-- Read-only operational evidence for server-side Phase 2F verification.
-- No browser-authenticated role receives these private workflow tables.
grant select on table public.directory_profile_versions to service_role;
grant select on table public.contact_requests to service_role;
grant select on table public.contact_request_history to service_role;
grant select on table public.notification_preferences to service_role;

commit;
