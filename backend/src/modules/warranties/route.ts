import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createWarrantySchema,
  updateWarrantySchema,
  warrantyIdParamSchema,
  listWarrantiesQuerySchema,
} from "./schema";
import {
  createWarrantyController,
  deleteWarrantyController,
  getWarrantyDetailController,
  listWarrantiesController,
  updateWarrantyController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listWarrantiesController);
router.get("/:id", requireRoles(readRoles), getWarrantyDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createWarrantySchema), createWarrantyController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateWarrantySchema), updateWarrantyController);
router.delete("/:id", requireRoles(writeRoles), deleteWarrantyController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

