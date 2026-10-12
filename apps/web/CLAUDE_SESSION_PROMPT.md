# Copy-paste prompt for an integration coding session

Paste everything below into a new coding session after attaching the private GitHub repository `dillonmohr8777/bridge-software-frontend`.

---

Use only the private GitHub repository `dillonmohr8777/bridge-software-frontend` for this task.

This is the Bridge software-development project for Tori: a cannabis-industry directory and professional-network web application. It is not Bridge of Hope OTC, an SEO engagement, or a generic client-meeting-prep task.

First report:

1. Repository name.
2. Current branch and commit.
3. Whether the work branch started from `development`.
4. The first heading in `CLAUDE.md`.
5. The application stack from `package.json`.

If you cannot read those files, stop and say: `The Bridge integration repository is not connected to this session.` Do not substitute the historical public prototype.

Read these files completely before editing:

1. `CLAUDE.md`
2. `docs/INTEGRATION-PIPELINE.md`
3. `docs/INTEGRATION-API-CONTRACT.md`
4. `CONTRIBUTING.md`
5. `README.md`
6. `lib/phase3/types.ts`
7. `lib/phase3/http-client.ts`
8. the affected route and component files

Current state:

- `development` automatically deploys to `https://bridge-connected-signal-dev.netlify.app`.
- `production` automatically deploys to `https://bridge-connected-signal.netlify.app`.
- Miraj owns backend APIs and wiring them into the existing frontend.
- Dillon owns the canonical frontend, UX, preview QA, and production promotion.
- The current Connected purple UI is preserved during integration.
- The app intentionally uses a mock adapter until `NEXT_PUBLIC_BRIDGE_API_BASE` points to an inspectable Greencubes API origin.
- `/join` implements role selection as Step 1 of 4. Steps 2–4 require authenticated draft persistence, protected evidence upload/scan state, and verification review/submit behavior. The required capability map is in `docs/INTEGRATION-API-CONTRACT.md`.

Do not rebuild the app, rename routes, restyle screens, invent backend security behavior, or commit secrets. If the Greencubes route table differs from the checked-in adapter, make the smallest typed adapter change and document the mapping.

For each change:

1. Identify the backend branch/commit and staging API origin.
2. State the routes, roles, states, and API types affected.
3. Implement the smallest coherent vertical slice.
4. Run `npm run test:phase3`, `npm run typecheck`, `npm run lint`, and `npm run build`.
5. Push to a feature branch based on `development` and verify the preview deploy.
6. Do not promote to `production` until Dillon has reviewed the preview.

Your first response should contain only the repository/branch confirmation, a concise integration status, the exact contract mismatch or next slice, and any blocker that requires Dillon or Miraj.

---
