import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import authRoutes from "../../modules/auth/route";
import usersRoutes from "../../modules/users/route";
import rolesRoutes from "../../modules/roles/route";
import auditLogsRoutes from "../../modules/audit-logs/route";
import systemSettingsRoutes from "../../modules/system-settings/route";
import notificationsRoutes from "../../modules/notifications/route";
import customersRoutes from "../../modules/customers/route";
import contractsRoutes from "../../modules/contracts/route";
import handoversRoutes from "../../modules/handovers/route";
import warrantiesRoutes from "../../modules/warranties/route";
import materialsRoutes from "../../modules/materials/route";
import productsRoutes from "../../modules/products/route";
import researchProjectsRoutes from "../../modules/research-projects/route";
import tasksRoutes from "../../modules/tasks/route";
import trainingRoutes from "../../modules/training/route";
import documentsRoutes from "../../modules/documents/route";
import reportsRoutes from "../../modules/reports/route";
import contactsRoutes from "../../modules/contacts/route";
import crmActivitiesRoutes from "../../modules/crm-activities/route";
import customerFeedbacksRoutes from "../../modules/customer-feedbacks/route";
import {
  feedbackAnalyticsByCustomerController,
  feedbackAnalyticsByMaterialController,
  feedbackAnalyticsByProductController,
  feedbackAnalyticsCustomerDetailController,
} from "../../modules/customer-feedbacks/controller";
import feedbackExecutionUnitsRoutes from "../../modules/feedback-execution-units/route";
import rolePermissionsRoutes from "../../modules/role-permissions/route";
import definitionsRoutes from "../../modules/definitions/route";
import {
  contractClauseGroupsRouter,
  contractClausesRouter,
} from "../../modules/contract-clauses/route";
import notificationPreferencesRoutes from "../../modules/notification-preferences/route";
import workflowsRoutes from "../../modules/workflows/route";
import workflowDocumentsRoutes from "../../modules/workflow-documents/route";
import customerAnniversariesRoutes from "../../modules/customer-anniversaries/route";
import anniversarySubscriptionsRoutes from "../../modules/anniversary-subscriptions/route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/audit-logs", auditLogsRoutes);
router.use("/system-settings", systemSettingsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/customers", customersRoutes);
router.use("/contacts", contactsRoutes);
router.use("/crm-activities", crmActivitiesRoutes);
/** Analytics trước mount router con — tránh `/:id` nuốt `analytics` (404). */
const feedbackReadRoles = ["admin", "manager", "technician", "viewer", "sales"];
router.get(
  "/customer-feedbacks/analytics/by-customer",
  requireAuth,
  requireRoles(feedbackReadRoles),
  feedbackAnalyticsByCustomerController,
);
router.get(
  "/customer-feedbacks/analytics/by-product",
  requireAuth,
  requireRoles(feedbackReadRoles),
  feedbackAnalyticsByProductController,
);
router.get(
  "/customer-feedbacks/analytics/by-material",
  requireAuth,
  requireRoles(feedbackReadRoles),
  feedbackAnalyticsByMaterialController,
);
router.get(
  "/customer-feedbacks/analytics/customer/:customerId/detail",
  requireAuth,
  requireRoles(feedbackReadRoles),
  feedbackAnalyticsCustomerDetailController,
);
router.use("/customer-feedbacks", customerFeedbacksRoutes);
router.use("/feedback-execution-units", feedbackExecutionUnitsRoutes);
router.use("/role-permissions", rolePermissionsRoutes);
router.use("/contracts", contractsRoutes);
router.use("/handovers", handoversRoutes);
router.use("/warranties", warrantiesRoutes);
router.use("/materials", materialsRoutes);
router.use("/products", productsRoutes);
router.use("/research-projects", researchProjectsRoutes);
router.use("/tasks", tasksRoutes);
router.use("/training", trainingRoutes);
// alias for compatibility
router.use("/training-courses", trainingRoutes);
router.use("/documents", documentsRoutes);
router.use("/reports", reportsRoutes);
router.use("/definitions", definitionsRoutes);
router.use("/contract-clauses", contractClausesRouter);
router.use("/contract-clause-groups", contractClauseGroupsRouter);
router.use("/notification-preferences", notificationPreferencesRoutes);
router.use("/workflows", workflowsRoutes);
router.use("/workflow-instances", workflowDocumentsRoutes);
router.use("/customer-anniversaries", customerAnniversariesRoutes);
router.use("/anniversary-subscriptions", anniversarySubscriptionsRoutes);

export default router;

