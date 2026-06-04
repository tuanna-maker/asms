import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createWarrantySchema, updateWarrantySchema } from "./schema";
import {
  createWarrantyController,
  deleteWarrantyController,
  getWarrantyDetailController,
  listWarrantiesController,
  updateWarrantyController,
} from "./controller";

const router = Router();
const M = "bao-hanh";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listWarrantiesController);
router.get("/:id", requireModulePermission(M, "read"), getWarrantyDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createWarrantySchema), createWarrantyController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateWarrantySchema), updateWarrantyController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteWarrantyController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
