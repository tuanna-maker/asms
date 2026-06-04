import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { listRolePermissionsController, updateRolePermissionsController } from "./controller";
import { updateRolePermissionsSchema } from "./schema";

const router = Router();
const M = "cai-dat.phan-quyen";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listRolePermissionsController);
router.put(
  "/",
  requireModulePermission(M, "update"),
  validateBody(updateRolePermissionsSchema),
  updateRolePermissionsController,
);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
