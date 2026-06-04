import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createRoleController,
  deleteRoleController,
  getRoleController,
  listRolesController,
  updateRoleController,
} from "./controller";
import { createRoleSchema, updateRoleSchema } from "./schema";

const router = Router();
const M = "cai-dat.vai-tro";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listRolesController);
router.get("/:id", requireModulePermission(M, "read"), getRoleController);
router.post("/", requireModulePermission(M, "create"), validateBody(createRoleSchema), createRoleController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateRoleSchema), updateRoleController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteRoleController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
