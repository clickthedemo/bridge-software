begin;

-- Notification enrichment resolves the organization and business attached to
-- a verification item. Keep this trusted read available only to service_role.
grant select on table public.verification_cases to service_role;

commit;
