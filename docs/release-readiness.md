# Release Readiness Checklist

## Environment
- Verify `VITE_API_URL` points to target backend.
- Verify deploy `.env` from [`.env.example`](../.env.example): `DATABASE_URL`, `JWT_SECRET` (≥32 chars), `CORS_ORIGINS`, `NODE_ENV=production`.
- Production security: HTTPS (`nginx.prod.conf`), protected uploads, JWT access TTL (`JWT_ACCESS_EXPIRES_IN`, default 1h).
- Verify auth rate-limit env for production:
  - `AUTH_RATE_LIMIT_WINDOW_MS` (default: `60000`)
  - `AUTH_LOGIN_MAX_REQUESTS` (default: `10`)
  - `AUTH_REFRESH_MAX_REQUESTS` (default: `20`)
  - `AUTH_REGISTER_PUBLIC_MAX_REQUESTS` (default: `5`; only applies when `AUTH_ALLOW_PUBLIC_REGISTRATION=true` outside production)
- Registration policy:
  - **Production**: `POST /api/v1/auth/register` returns `403`; create users via `POST /api/v1/users` as an authenticated `admin`.
  - **Non-production**: by default registration requires an **admin JWT** (`Authorization: Bearer …`). Optionally set `AUTH_ALLOW_PUBLIC_REGISTRATION=true` **only for local/demo** if you explicitly need anonymous sign-up.
- Ensure PostgreSQL is reachable from runtime environment.

## Database
- Run Prisma migration on target env.
- Run Prisma client generation.
- **Bootstrap users (staging/production)**:
  - The API does **not** auto-seed users when `NODE_ENV=production`.
  - After first deployment, create baseline accounts once: from `backend/`, run `npm run bootstrap:auth` against the target `DATABASE_URL` (idempotent upsert).
  - Then rotate away demo passwords immediately and prefer creating additional users via **Settings / Users API** (`admin` only).

## Quality Gates
- Frontend: `pnpm lint`, `pnpm build`, `pnpm test`.
- Backend: `pnpm test:be`, `cd backend && npm run build`.
- CI: `.github/workflows/ci.yml` (lint + test + build).
- UAT: [`docs/uat-signoff-production.md`](docs/uat-signoff-production.md) + [`docs/uat-checklist.md`](docs/uat-checklist.md).
- Post-deploy smoke: `pnpm post-deploy:smoke` (uat-role + uc-smoke + dashboard-audit).
- Full UC audit: `pnpm audit:uc` (uc-smoke + by-role + crud-validation + api-error-audit).
- E2E API smoke: `pnpm smoke:e2e`.
- E2E browser: `pnpm test:e2e` (Playwright).
- Cutover: [`docs/cutover-runbook.md`](docs/cutover-runbook.md).

## Security and Access
- Validate JWT refresh/logout behavior.
- Validate role-based route and action guards.
- Verify no debug/test secrets are shipped.

## Rollback Plan
- Keep previous frontend build artifact and backend image.
- Keep backup of database before migration.
- If release fails:
  1. Roll back frontend artifact.
  2. Roll back backend deployment.
  3. Restore DB backup if schema/data issue occurs.

## Handover
- Mapping reference: [`docs/frontend-backend-mapping.md`](docs/frontend-backend-mapping.md).
- Data model reference: [`docs/data-model.md`](docs/data-model.md).
- Post-deploy smoke: [`docs/production-smoke.md`](production-smoke.md).
