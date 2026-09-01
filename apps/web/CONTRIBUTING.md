# Contributing to Bridge frontend

## One-time access

1. Accept the GitHub invitation to `dillonmohr8777/bridge-software-frontend`.
2. Confirm you can read both `development` and `production`.
3. Confirm the Netlify preview project is visible at `bridge-connected-signal-dev`.
4. Never paste passwords, tokens, keys, EINs, verification files, or production records into GitHub, Slack, issues, pull requests, or build logs.

## Branch workflow

```powershell
git fetch origin
git switch development
git pull --ff-only origin development
git switch -c feature/<short-name>
```

Push the feature branch and open a pull request into `development`. After review, merge to `development` and verify the automatic preview deploy. Only then open a pull request from `development` to `production`.

Do not work directly on `production`. GitHub branch protection is unavailable for this private repository on the current plan, so this rule is enforced by the team and reviewed Netlify evidence.

## Local setup

```powershell
npm ci
npm run dev
```

The app uses the in-memory adapter unless `NEXT_PUBLIC_BRIDGE_API_BASE` is supplied locally. Do not commit `.env` files.

## Required checks

```powershell
npm run test:phase3
npm run typecheck
npm run lint
npm run build
```

For changes to the historical visual-direction previews, also run:

```powershell
npm run build:staging
npm run test:staging
```

## Pull request evidence

Every integration pull request must state:

- backend branch/commit and API origin used for testing
- frontend routes and roles affected
- endpoint/type changes, if any
- screenshots or a preview URL for changed states
- success, loading, empty, validation, forbidden, unavailable, and retry behavior checked
- test/build results
- security or data-handling impact
- any contract mismatch requiring Dillon or Miraj to decide
