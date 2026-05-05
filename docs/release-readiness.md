# Release Readiness Checklist

## Environment
- Verify `VITE_API_URL` points to target backend.
- Verify backend `.env` values (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
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
- Frontend: `npm run lint`, `npm run build`, `npm run test`.
- Backend: `npm run build`.
- Execute UAT checklist in [`docs/uat-checklist.md`](docs/uat-checklist.md).
- After deploy, run quick smoke in [`docs/production-smoke.md`](production-smoke.md).
- Targeted regression tests now include:
  - `src/test/reports-service.test.ts`
  - `src/test/training-service.test.ts`
  - `src/test/materials-service.test.ts`
  - `src/test/use-training.test.ts`
  - `src/test/training-payload.test.ts`

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
