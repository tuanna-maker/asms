import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createCrmActivitySchema, updateCrmActivitySchema } from "./schema";
import {
  createCrmActivityController,
  deleteCrmActivityController,
  getCrmActivityDetailController,
  listCrmActivitiesController,
  updateCrmActivityController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician", "sales"];

router.get("/", requireRoles(readRoles), listCrmActivitiesController);
router.get("/:id", requireRoles(readRoles), getCrmActivityDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createCrmActivitySchema), createCrmActivityController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateCrmActivitySchema), updateCrmActivityController);
router.delete("/:id", requireRoles(writeRoles), deleteCrmActivityController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
