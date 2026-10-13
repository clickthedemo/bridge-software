begin;

-- Server-side administration needs read-only observability for Phase 2D
-- workflow verification. These grants are not extended to anon/authenticated.
grant select on table public.organization_locations to service_role;
grant select on table public.verification_items to service_role;
grant select on table public.directory_profile_history to service_role;
grant select on table public.notifications to service_role;
grant select on table public.transactional_email_outbox to service_role;

commit;
