import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createCustomerSchema, updateCustomerSchema } from "./schema";
import {
  createCustomerController,
  deleteCustomerController,
  getCustomerDetailController,
  listCustomersController,
  updateCustomerController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "viewer", "sales"];
const writeRoles = ["admin", "manager", "sales"];

router.get("/", requireRoles(readRoles), listCustomersController);
router.get("/:id", requireRoles(readRoles), getCustomerDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createCustomerSchema), createCustomerController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateCustomerSchema), updateCustomerController);
router.delete("/:id", requireRoles(writeRoles), deleteCustomerController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

