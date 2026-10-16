# BRIDGE

BRIDGE is a multi-tenant business and cannabis verification platform.

## Repository Structure

- `apps/web` — React frontend
- `apps/api` — Node.js backend
- `packages/database` — PostgreSQL/Supabase database definitions
- `packages/shared` — shared types, schemas, and constants
- `packages/config` — shared configuration
- `infrastructure/aws` — AWS infrastructure
- `docs` — project documentation

## Development

Node.js: 24.11.0  
pnpm: 10.34.5

## Database migrations

`packages/database/supabase` is the only authoritative Supabase CLI configuration
and migration location. Run database commands from the workspace root through the
database package:

```powershell
corepack pnpm db:migrations:list
corepack pnpm db:push
```

Confirm that the linked project is a disposable development or staging project
before running any command that changes a database. Never run `db:push`, reset,
repair, or seed against production.
