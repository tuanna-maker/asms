import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  listNotificationPreferencesController,
  putNotificationPreferencesController,
} from "./controller";
import { putNotificationPrefsSchema } from "./schema";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];

router.get("/", requireRoles(readRoles), listNotificationPreferencesController);
router.put("/", requireRoles(readRoles), validateBody(putNotificationPrefsSchema), putNotificationPreferencesController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
