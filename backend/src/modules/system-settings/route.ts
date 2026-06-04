import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { listSystemSettingsController, updateSystemSettingsController } from "./controller";
import { updateSystemSettingsSchema } from "./schema";

const router = Router();
const M = "cai-dat.he-thong";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listSystemSettingsController);
router.put(
  "/",
  requireModulePermission(M, "update"),
  validateBody(updateSystemSettingsSchema),
  updateSystemSettingsController,
);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
