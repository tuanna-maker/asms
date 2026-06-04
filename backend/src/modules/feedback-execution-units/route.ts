import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
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
const M = "phan-anh";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listUnitsController);
router.post("/", requireModulePermission(M, "create"), validateBody(createUnitSchema), createUnitController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateUnitSchema), updateUnitController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteUnitController);

router.get("/routing-rules/list", requireModulePermission(M, "read"), listRoutingRulesController);
router.post(
  "/routing-rules",
  requireModulePermission(M, "create"),
  validateBody(createRoutingRuleSchema),
  createRoutingRuleController,
);
router.put(
  "/routing-rules/:ruleId",
  requireModulePermission(M, "update"),
  validateBody(updateRoutingRuleSchema),
  updateRoutingRuleController,
);
router.delete("/routing-rules/:ruleId", requireModulePermission(M, "delete"), deleteRoutingRuleController);

export default router;
