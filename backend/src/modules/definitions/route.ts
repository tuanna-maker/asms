import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createDefinitionController,
  deleteDefinitionController,
  getDefinitionUsageController,
  listDefinitionsController,
  reorderDefinitionsController,
  updateDefinitionController,
} from "./controller";
import { createDefinitionSchema, reorderDefinitionsSchema, updateDefinitionSchema } from "./schema";

const router = Router();
const M = "cai-dat.thuoc-tinh";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listDefinitionsController);
router.put("/reorder", requireModulePermission(M, "update"), validateBody(reorderDefinitionsSchema), reorderDefinitionsController);
router.get("/:id/usage", requireModulePermission(M, "read"), getDefinitionUsageController);
router.post("/", requireModulePermission(M, "create"), validateBody(createDefinitionSchema), createDefinitionController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateDefinitionSchema), updateDefinitionController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteDefinitionController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
