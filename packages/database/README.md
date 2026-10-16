# Bridge database

This package is the authoritative home for the Bridge Supabase CLI configuration
and ordered migration history:

- Configuration: `supabase/config.toml`
- Migrations: `supabase/migrations/`

Run Supabase commands through this workspace package. From the repository root:

```powershell
corepack pnpm db:migrations:list
corepack pnpm db:push
```

The package must be linked explicitly before linked commands can run. Confirm the
target project is a non-production development or staging environment before
linking it or executing a write command. Do not use the migration copies under
`apps/api` for `supabase db push`.

`db:push` is intentionally available as an explicit operator command; automated
tests and normal application startup do not invoke it.
