import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  closeFeedbackSchema,
  createCustomerFeedbackSchema,
  noteBodySchema,
  updateAssignmentSchema,
  updateCustomerFeedbackSchema,
  createFeedbackCommentSchema,
} from "./schema";

import {
  closeFeedbackController,
  completeRepairAndCloseFeedbackController,
  createCustomerFeedbackController,
  deleteCustomerFeedbackController,
  feedbackSummaryController,
  getCustomerFeedbackDetailController,
  linkageOptionsController,
  listCustomerFeedbacksController,
  reopenFeedbackController,
  requestCloseController,
  routingPreviewController,
  updateAssignmentController,
  updateCustomerFeedbackController,
  createFeedbackCommentController,
  feedbackAnalyticsByCustomerController,
  feedbackAnalyticsByProductController,
  feedbackAnalyticsByMaterialController,
  feedbackAnalyticsCustomerDetailController,
} from "./controller";

const router = Router();
const analyticsRouter = Router();
const M = "phan-anh";

router.use(requireAuth);

router.get("/linkage-options", requireModulePermission(M, "read"), linkageOptionsController);
router.get("/routing-preview", requireModulePermission(M, "read"), routingPreviewController);
router.get("/summary", requireModulePermission(M, "read"), feedbackSummaryController);

analyticsRouter.get("/by-customer", requireModulePermission(M, "read"), feedbackAnalyticsByCustomerController);
analyticsRouter.get("/by-product", requireModulePermission(M, "read"), feedbackAnalyticsByProductController);
analyticsRouter.get("/by-material", requireModulePermission(M, "read"), feedbackAnalyticsByMaterialController);
analyticsRouter.get(
  "/customer/:customerId/detail",
  requireModulePermission(M, "read"),
  feedbackAnalyticsCustomerDetailController,
);
router.use("/analytics", analyticsRouter);

router.get("/", requireModulePermission(M, "read"), listCustomerFeedbacksController);
router.get("/:id", requireModulePermission(M, "read"), getCustomerFeedbackDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createCustomerFeedbackSchema), createCustomerFeedbackController);
router.post(
  "/:id/comments",
  requireModulePermission(M, "update"),
  validateBody(createFeedbackCommentSchema),
  createFeedbackCommentController,
);
router.put(
  "/:id",
  requireModulePermission(M, "update"),
  validateBody(updateCustomerFeedbackSchema),
  updateCustomerFeedbackController,
);
router.patch(
  "/:id/assignments/:assignmentId",
  requireModulePermission(M, "update"),
  validateBody(updateAssignmentSchema),
  updateAssignmentController,
);
router.post(
  "/:id/request-close",
  requireModulePermission(M, "update"),
  validateBody(noteBodySchema),
  requestCloseController,
);
router.post(
  "/:id/close",
  requireModulePermission(M, "update"),
  validateBody(closeFeedbackSchema),
  closeFeedbackController,
);
router.post(
  "/:id/complete-repair-close",
  requireModulePermission(M, "update"),
  validateBody(noteBodySchema),
  completeRepairAndCloseFeedbackController,
);
router.post(
  "/:id/reopen",
  requireModulePermission(M, "update"),
  validateBody(noteBodySchema),
  reopenFeedbackController,
);
router.delete("/:id", requireModulePermission(M, "delete"), deleteCustomerFeedbackController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
