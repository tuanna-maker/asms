import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager"];

router.get("/", requireRoles(readRoles), listDefinitionsController);
router.put("/reorder", requireRoles(writeRoles), validateBody(reorderDefinitionsSchema), reorderDefinitionsController);
router.get("/:id/usage", requireRoles(readRoles), getDefinitionUsageController);
router.post("/", requireRoles(writeRoles), validateBody(createDefinitionSchema), createDefinitionController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateDefinitionSchema), updateDefinitionController);
router.delete("/:id", requireRoles(writeRoles), deleteDefinitionController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
