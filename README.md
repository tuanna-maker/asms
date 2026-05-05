# ERP Frontend + Backend

## Run locally

### Frontend
- Install deps: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- In local dev, Vite proxies `/api` to `http://localhost:4000` by default.
- In production, set `VITE_API_URL` to your backend origin.

### Backend
- Path: `backend/`
- Install deps: `npm install`
- Configure env in `backend/.env`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Optional auth hardening env:
  - `AUTH_RATE_LIMIT_WINDOW_MS` (default `60000`)
  - `AUTH_LOGIN_MAX_REQUESTS` (default `10`)
  - `AUTH_REFRESH_MAX_REQUESTS` (default `20`)
  - `AUTH_REGISTER_PUBLIC_MAX_REQUESTS` (default `5`, applies only with `AUTH_ALLOW_PUBLIC_REGISTRATION=true`)
- Registration: in production `POST /auth/register` is disabled (`403`). Use `POST /users` as `admin`. For first-time env setup run `npm run bootstrap:auth` from `backend/`. Outside production, `/auth/register` requires an admin token unless `AUTH_ALLOW_PUBLIC_REGISTRATION=true` (local/demo only).

## Authentication
- Frontend login page: `/login`
- Frontend uses JWT access token + refresh token flow in `src/lib/api.ts`.
- Protected routes are guarded by auth + role checks.

## References
- Data model: [`docs/data-model.md`](docs/data-model.md)
- FE/BE mapping: [`docs/frontend-backend-mapping.md`](docs/frontend-backend-mapping.md)
- UAT checklist: [`docs/uat-checklist.md`](docs/uat-checklist.md)
- Release checklist: [`docs/release-readiness.md`](docs/release-readiness.md)
- Production smoke (after deploy): [`docs/production-smoke.md`](docs/production-smoke.md)
