import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createProductSchema, updateProductSchema } from "./schema";
import {
  createProductController,
  deleteProductController,
  getProductDetailController,
  listProductsController,
  updateProductController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listProductsController);
router.post("/", requireRoles(writeRoles), validateBody(createProductSchema), createProductController);

router.get("/:id", requireRoles(readRoles), getProductDetailController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateProductSchema), updateProductController);
router.delete("/:id", requireRoles(writeRoles), deleteProductController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
