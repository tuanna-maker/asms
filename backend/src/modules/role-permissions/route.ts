import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { updateRolePermissionsSchema } from "./schema";
import {
  listRolePermissionsController,
  updateRolePermissionsController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager"];
const writeRoles = ["admin"];

router.get("/", requireRoles(readRoles), listRolePermissionsController);
router.put(
  "/",
  requireRoles(writeRoles),
  validateBody(updateRolePermissionsSchema),
  updateRolePermissionsController,
);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
