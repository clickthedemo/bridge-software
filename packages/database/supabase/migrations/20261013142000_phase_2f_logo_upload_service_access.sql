begin;

-- The API service creates and inspects short-lived upload contracts. End-user
-- roles retain no table access and finalization remains an authenticated RPC.
grant select, insert on table public.directory_profile_pending_uploads to service_role;

commit;
