# Bridge frontend integration pipeline

This private repository is the live Bridge frontend source for Greencubes API integration.

The integration baseline contains the age-gate Next.js app from commit `7a3e611` plus the pipeline handoff commits. Both Netlify sites are Git-linked to this repository.

## Ownership

- Dillon owns canonical frontend and UX.
- Greencubes owns backend APIs and wiring those APIs into this frontend.
- Do not restyle the product or replace screens while integrating.

## Branches

| Branch | Purpose | Netlify |
| --- | --- | --- |
| `development` | Daily integration work | Auto-deploys to the preview site |
| `production` | Approved releases | Auto-deploys to live `bridge-connected-signal` |

Default branch is `production`.

The private repository is on a GitHub plan that does not expose branch-protection rules. GitHub returned an upgrade-or-public requirement, so the source remains private and the production approval rule is enforced operationally: no direct work on `production`, and no production merge before Dillon QA. Do not spend money or make the repository public to change this without Dillon's explicit approval.

## Workflow

1. Create feature branches from `development`.
2. Push to `development` for an automatic preview deploy.
3. Review and test on the preview URL.
4. Open a pull request into `production` only after Dillon and the client approve the preview.
5. Merge to `production` to auto-deploy live.

Never place API keys, Supabase service-role keys, access tokens, passwords, or private verification documents in Git, Netlify build logs, browser storage, or public client-side variables.

## URLs

- Production: https://bridge-connected-signal.netlify.app
- Production admin: https://app.netlify.com/projects/bridge-connected-signal
- Preview: https://bridge-connected-signal-dev.netlify.app
- Preview admin: https://app.netlify.com/projects/bridge-connected-signal-dev
- Source: https://github.com/dillonmohr8777/bridge-software-frontend

## Access status as of 2026-08-31

- Miraj GitHub admin invitation: sent to `mirajmor`; acceptance is pending.
- Client GitHub admin invitation: sent to `getonthebridge0-max`; acceptance is pending.
- Miraj Netlify Developer membership: active for `mirajgreencubes@gmail.com`.
- Additional Netlify Developer invitations: pending for `clickthedemo@gmail.com` and `getonthebridge0@gmail.com`.

GitHub invitation acceptance is the only remaining access action Miraj must perform before he can create branches and push code. Netlify is already available to him.

## Environment contract

The frontend switches from mock mode to the live HTTP adapter only when `NEXT_PUBLIC_BRIDGE_API_BASE` is set.

- Preview site: set it to the Greencubes staging API origin.
- Production site: set it to the approved production API origin only after staging acceptance.
- The value must be an HTTPS origin. The frontend appends versioned `/api/v1/...` paths.
- Do not put secrets in `NEXT_PUBLIC_*` variables; those values are shipped to the browser.
- Greencubes must allow the exact preview and production origins in CORS and support credentialed requests if cookie sessions are used.

No Bridge API environment value was configured at handoff because Greencubes had not yet supplied an inspectable staging or production origin.

## First integration target

Wire Milestone 3 APIs (auth, RBAC, registration, login, verify, reset, EIN intake, admin verification queue) into the existing screens, starting with `/join` and login. Keep the current visual design.

The complete frontend contract, including the reason Steps 2–4 are not yet interactive and the endpoint/payload mapping already present in code, is in `docs/INTEGRATION-API-CONTRACT.md`.

## Release verification

Before preview:

```powershell
npm ci
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

Before production:

1. Confirm the preview deploy is `ready` and tied to the expected `development` commit.
2. Test `/`, `/join`, `/create`, `/my-profile`, `/explore`, and `/admin/verification` on desktop and mobile.
3. Validate login/session, role enforcement, onboarding save/resume, evidence upload and scan state, review submission, admin decisions, protected/public profile projection, and error states.
4. Confirm no secrets or real verification documents entered client logs or the repository.
5. Merge the reviewed commit to `production` and verify the production deploy reports the same commit.
