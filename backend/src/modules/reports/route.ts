import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";

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
const M = "bao-cao";
const D = "dashboard";

router.use(requireAuth);

router.get("/dashboard-summary", requireModulePermission(D, "read"), getDashboardSummaryController);
router.get("/", requireModulePermission(M, "read"), getReportsController);
router.get("/by-product-line", requireModulePermission(M, "read"), getReportsByProductLineController);
router.get("/feedback/by-customer", requireModulePermission(M, "read"), getReportsFeedbackByCustomerController);
router.get("/feedback/by-product-line", requireModulePermission(M, "read"), getReportsFeedbackByProductLineController);
router.get("/material-defects", requireModulePermission(M, "read"), getMaterialDefectsController);
router.get("/badges", requireModulePermission(D, "read"), getBadgesController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
