import { Router } from "express";
import authRoutes from "../../modules/auth/route";
import usersRoutes from "../../modules/users/route";
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
import definitionsRoutes from "../../modules/definitions/route";
import notificationPreferencesRoutes from "../../modules/notification-preferences/route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/customers", customersRoutes);
router.use("/contacts", contactsRoutes);
router.use("/crm-activities", crmActivitiesRoutes);
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
router.use("/notification-preferences", notificationPreferencesRoutes);

export default router;

