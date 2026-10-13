# Non-authoritative migration copies

The SQL files in this directory are retained because API tests inspect them
directly and repository history is based on these paths. They are not the
Supabase CLI source of truth.

Use `packages/database/supabase` for migration status, linking, and every
Supabase migration command. Do not run `supabase db push` from `apps/api`.
