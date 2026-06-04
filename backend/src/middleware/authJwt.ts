// Compatibility layer: giữ đường import cũ `middleware/authJwt`
// trong khi canonical files là `middleware/auth.ts` và `middleware/rbac.ts`.
export { requireAuth } from "./auth";
export {
  requireRoles,
  requireRole,
  requireModulePermission,
  requireHttpModulePermission,
} from "./rbac";

