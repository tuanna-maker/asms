import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
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
const M = "de-tai";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listResearchProjectsController);
router.get("/:id", requireModulePermission(M, "read"), getResearchProjectDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createResearchProjectSchema), createResearchProjectController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateResearchProjectSchema), updateResearchProjectController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteResearchProjectController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
