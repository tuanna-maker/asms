import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  addStepController,
  advanceInstanceController,
  attachWorkflowController,
  createWorkflowController,
  deleteStepController,
  deleteWorkflowController,
  getInstanceController,
  getInstanceForEntityController,
  getWorkflowController,
  listWorkflowsController,
  reorderStepsController,
  updateStepController,
  updateWorkflowController,
} from "./controller";
import {
  advanceInstanceSchema,
  attachWorkflowSchema,
  createWorkflowSchema,
  reorderStepsSchema,
  updateWorkflowSchema,
  upsertStepSchema,
} from "./schema";

const router = Router();
const M = "quy-trinh";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listWorkflowsController);
router.post("/", requireModulePermission(M, "create"), validateBody(createWorkflowSchema), createWorkflowController);

router.get("/instances", requireModulePermission(M, "read"), getInstanceForEntityController);
router.post(
  "/instances/attach",
  requireModulePermission(M, "update"),
  validateBody(attachWorkflowSchema),
  attachWorkflowController,
);
router.get("/instances/:id", requireModulePermission(M, "read"), getInstanceController);
router.post(
  "/instances/:id/advance",
  requireModulePermission(M, "update"),
  validateBody(advanceInstanceSchema),
  advanceInstanceController,
);

router.get("/:id", requireModulePermission(M, "read"), getWorkflowController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateWorkflowSchema), updateWorkflowController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteWorkflowController);

router.post("/:id/steps", requireModulePermission(M, "update"), validateBody(upsertStepSchema), addStepController);
router.put("/:id/steps/reorder", requireModulePermission(M, "update"), validateBody(reorderStepsSchema), reorderStepsController);
router.put("/:id/steps/:stepId", requireModulePermission(M, "update"), validateBody(upsertStepSchema.partial()), updateStepController);
router.delete("/:id/steps/:stepId", requireModulePermission(M, "delete"), deleteStepController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
