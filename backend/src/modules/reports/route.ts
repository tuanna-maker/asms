import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";

import {
  getBadgesController,
  getDashboardSummaryController,
  getMaterialDefectsController,
  getReportsByProductLineController,
  getReportsController,
  getReportsFeedbackByCustomerController,
  getReportsFeedbackByProductLineController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "viewer", "sales"];

router.get("/dashboard-summary", requireRoles(readRoles), getDashboardSummaryController);
router.get("/", requireRoles(readRoles), getReportsController);
router.get("/by-product-line", requireRoles(readRoles), getReportsByProductLineController);
router.get("/feedback/by-customer", requireRoles(readRoles), getReportsFeedbackByCustomerController);
router.get("/feedback/by-product-line", requireRoles(readRoles), getReportsFeedbackByProductLineController);
router.get("/material-defects", requireRoles(readRoles), getMaterialDefectsController);
router.get("/badges", getBadgesController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

