# UAT Checklist

## Scope
- Roles: `admin`, `manager`, `technician`, `viewer`
- Modules: Auth, Users, Customers/CRM, Contracts, Handovers, Products, Warranty, Materials, Tasks, Documents, Reports, Training

## Authentication
- Login succeeds with seeded users.
- `POST /auth/register` is forbidden in production; in lower envs either admin JWT is required or public registration is intentionally enabled via env (see [`docs/release-readiness.md`](docs/release-readiness.md)).
- Invalid credentials return error message.
- Expired token triggers refresh automatically.
- Missing/invalid refresh token clears session and returns to `/login`.
- Logout clears local session and blocks protected routes.

## RBAC
- `viewer` can access read-only pages and cannot execute write actions.
- `technician` can access operational modules per role matrix.
- `manager` can access managerial modules and write actions allowed by backend.
- `admin` can access all routes including settings.

## Module CRUD
- Users (Settings): list/create/update/delete works with RBAC (`admin` write, `manager` read).
- Customers: create, update, delete, list refresh.
- CRM contacts/activities: create, update, delete, customer filter works.
- Contracts: create, update status/progress, delete, list refresh.
- Handovers: create/update/delete/list + filters work.
- Products: create/list works; warranty product selector loads data correctly.
- Warranty: create ticket, update workflow/status, delete, list refresh.
- Materials: create/import, update stock metadata, delete, list refresh.
- Materials transfers: create transfer, quantity validation, available stock decrement, transfer list refresh.
- Tasks: create, update progress/status, delete, board/list/calendar refresh.
- Documents: upload/create metadata, update, delete, list refresh.
- Reports: year filter returns correct data and no crash on empty datasets.
- Training:
  - Courses create/update/delete/list/detail.
  - Trainees create/update/delete and attendance toggle persist.
  - Sessions create/update/delete and status quick-update persist.

## Reliability
- Build frontend/backend passes.
- Lint passes on changed files.
- Test suite passes.
