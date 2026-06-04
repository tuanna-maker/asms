import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
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
const M = "khach-hang.khach-hang";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listCustomersController);
router.get("/:id", requireModulePermission(M, "read"), getCustomerDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createCustomerSchema), createCustomerController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateCustomerSchema), updateCustomerController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteCustomerController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
