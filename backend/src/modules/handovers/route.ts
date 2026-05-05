import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listHandoversController);
router.get("/:id", requireRoles(readRoles), getHandoverDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createHandoverSchema), createHandoverController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateHandoverSchema), updateHandoverController);
router.delete("/:id", requireRoles(writeRoles), deleteHandoverController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
