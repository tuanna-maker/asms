import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createCustomerFeedbackSchema, updateCustomerFeedbackSchema } from "./schema";
import {
  createCustomerFeedbackController,
  deleteCustomerFeedbackController,
  getCustomerFeedbackDetailController,
  listCustomerFeedbacksController,
  updateCustomerFeedbackController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician", "sales"];

router.get("/", requireRoles(readRoles), listCustomerFeedbacksController);
router.get("/:id", requireRoles(readRoles), getCustomerFeedbackDetailController);

router.post(
  "/",
  requireRoles(writeRoles),
  validateBody(createCustomerFeedbackSchema),
  createCustomerFeedbackController,
);
router.put(
  "/:id",
  requireRoles(writeRoles),
  validateBody(updateCustomerFeedbackSchema),
  updateCustomerFeedbackController,
);
router.delete("/:id", requireRoles(writeRoles), deleteCustomerFeedbackController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
