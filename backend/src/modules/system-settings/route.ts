import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { listSystemSettingsController, updateSystemSettingsController } from "./controller";
import { updateSystemSettingsSchema } from "./schema";

const router = Router();

router.use(requireAuth);

router.get("/", requireRoles(["admin", "manager"]), listSystemSettingsController);
router.put(
  "/",
  requireRoles(["admin"]),
  validateBody(updateSystemSettingsSchema),
  updateSystemSettingsController,
);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
