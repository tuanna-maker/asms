import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager"];
const writeRoles = ["admin"];

router.get("/", requireRoles(readRoles), listRolesController);
router.get("/:id", requireRoles(readRoles), getRoleController);
router.post("/", requireRoles(writeRoles), validateBody(createRoleSchema), createRoleController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateRoleSchema), updateRoleController);
router.delete("/:id", requireRoles(writeRoles), deleteRoleController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
