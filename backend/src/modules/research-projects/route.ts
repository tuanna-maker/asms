import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createResearchProjectSchema, updateResearchProjectSchema } from "./schema";
import {
  createResearchProjectController,
  deleteResearchProjectController,
  getResearchProjectDetailController,
  listResearchProjectsController,
  updateResearchProjectController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listResearchProjectsController);
router.get("/:id", requireRoles(readRoles), getResearchProjectDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createResearchProjectSchema), createResearchProjectController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateResearchProjectSchema), updateResearchProjectController);
router.delete("/:id", requireRoles(writeRoles), deleteResearchProjectController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
