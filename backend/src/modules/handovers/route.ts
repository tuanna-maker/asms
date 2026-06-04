import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createHandoverSchema, updateHandoverSchema } from "./schema";
import {
  createHandoverController,
  deleteHandoverController,
  getHandoverDetailController,
  listHandoversController,
  updateHandoverController,
} from "./controller";

const router = Router();
const M = "ban-giao";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listHandoversController);
router.get("/:id", requireModulePermission(M, "read"), getHandoverDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createHandoverSchema), createHandoverController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateHandoverSchema), updateHandoverController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteHandoverController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
