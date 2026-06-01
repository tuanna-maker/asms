import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";

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

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician", "sales"];

router.get("/linkage-options", requireRoles(readRoles), linkageOptionsController);
router.get("/routing-preview", requireRoles(readRoles), routingPreviewController);
router.get("/summary", requireRoles(readRoles), feedbackSummaryController);

analyticsRouter.get("/by-customer", requireRoles(readRoles), feedbackAnalyticsByCustomerController);
analyticsRouter.get("/by-product", requireRoles(readRoles), feedbackAnalyticsByProductController);
analyticsRouter.get("/by-material", requireRoles(readRoles), feedbackAnalyticsByMaterialController);
analyticsRouter.get(
  "/customer/:customerId/detail",
  requireRoles(readRoles),
  feedbackAnalyticsCustomerDetailController,
);
router.use("/analytics", analyticsRouter);

router.get("/", requireRoles(readRoles), listCustomerFeedbacksController);
router.get("/:id", requireRoles(readRoles), getCustomerFeedbackDetailController);


router.post(

  "/",

  requireRoles(writeRoles),

  validateBody(createCustomerFeedbackSchema),

  createCustomerFeedbackController,

);

router.post(

  "/:id/comments",

  requireRoles(writeRoles),

  validateBody(createFeedbackCommentSchema),

  createFeedbackCommentController,

);

router.put(

  "/:id",

  requireRoles(writeRoles),

  validateBody(updateCustomerFeedbackSchema),

  updateCustomerFeedbackController,

);

router.patch(

  "/:id/assignments/:assignmentId",

  requireRoles(writeRoles),

  validateBody(updateAssignmentSchema),

  updateAssignmentController,

);

router.post(

  "/:id/request-close",

  requireRoles(writeRoles),

  validateBody(noteBodySchema),

  requestCloseController,

);

router.post(

  "/:id/close",

  requireRoles(writeRoles),

  validateBody(closeFeedbackSchema),

  closeFeedbackController,

);

router.post(

  "/:id/reopen",

  requireRoles(writeRoles),

  validateBody(noteBodySchema),

  reopenFeedbackController,

);

router.delete("/:id", requireRoles(writeRoles), deleteCustomerFeedbackController);



router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));



export default router;

