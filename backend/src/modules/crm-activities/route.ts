import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
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
const M = "khach-hang.hoat-dong";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listCrmActivitiesController);
router.get("/:id", requireModulePermission(M, "read"), getCrmActivityDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createCrmActivitySchema), createCrmActivityController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateCrmActivitySchema), updateCrmActivityController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteCrmActivityController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
