import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  listNotificationPreferencesController,
  putNotificationPreferencesController,
} from "./controller";
import { putNotificationPrefsSchema } from "./schema";

const router = Router();
const M = "cai-dat.thong-bao";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listNotificationPreferencesController);
router.put("/", requireModulePermission(M, "update"), validateBody(putNotificationPrefsSchema), putNotificationPreferencesController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
