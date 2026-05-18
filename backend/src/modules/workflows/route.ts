import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
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
router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "sales", "viewer"];
const writeRoles = ["admin", "manager"];

router.get("/", requireRoles(readRoles), listWorkflowsController);
router.post("/", requireRoles(writeRoles), validateBody(createWorkflowSchema), createWorkflowController);

router.get("/instances", requireRoles(readRoles), getInstanceForEntityController);
router.post(
  "/instances/attach",
  requireRoles(writeRoles),
  validateBody(attachWorkflowSchema),
  attachWorkflowController,
);
router.get("/instances/:id", requireRoles(readRoles), getInstanceController);
router.post(
  "/instances/:id/advance",
  requireRoles(readRoles),
  validateBody(advanceInstanceSchema),
  advanceInstanceController,
);

router.get("/:id", requireRoles(readRoles), getWorkflowController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateWorkflowSchema), updateWorkflowController);
router.delete("/:id", requireRoles(writeRoles), deleteWorkflowController);

router.post("/:id/steps", requireRoles(writeRoles), validateBody(upsertStepSchema), addStepController);
router.put("/:id/steps/reorder", requireRoles(writeRoles), validateBody(reorderStepsSchema), reorderStepsController);
router.put("/:id/steps/:stepId", requireRoles(writeRoles), validateBody(upsertStepSchema.partial()), updateStepController);
router.delete("/:id/steps/:stepId", requireRoles(writeRoles), deleteStepController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
