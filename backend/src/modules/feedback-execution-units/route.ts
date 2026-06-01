import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createRoutingRuleController,
  createUnitController,
  deleteRoutingRuleController,
  deleteUnitController,
  listRoutingRulesController,
  listUnitsController,
  updateRoutingRuleController,
  updateUnitController,
} from "./controller";
import { createRoutingRuleSchema, createUnitSchema, updateRoutingRuleSchema, updateUnitSchema } from "./schema";

const router = Router();
router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager"];

router.get("/", requireRoles(readRoles), listUnitsController);
router.post("/", requireRoles(writeRoles), validateBody(createUnitSchema), createUnitController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateUnitSchema), updateUnitController);
router.delete("/:id", requireRoles(writeRoles), deleteUnitController);

router.get("/routing-rules/list", requireRoles(readRoles), listRoutingRulesController);
router.post(
  "/routing-rules",
  requireRoles(writeRoles),
  validateBody(createRoutingRuleSchema),
  createRoutingRuleController,
);
router.put(
  "/routing-rules/:ruleId",
  requireRoles(writeRoles),
  validateBody(updateRoutingRuleSchema),
  updateRoutingRuleController,
);
router.delete("/routing-rules/:ruleId", requireRoles(writeRoles), deleteRoutingRuleController);

export default router;
