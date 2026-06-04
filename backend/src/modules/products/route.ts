import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createProductSchema,
  updateProductBomSchema,
  updateProductSchema,
  upsertProductBomSchema,
} from "./schema";
import {
  createProductController,
  deleteProductBomController,
  deleteProductController,
  getProductDetailController,
  listProductsController,
  updateProductBomController,
  updateProductController,
  upsertProductBomController,
} from "./controller";

const router = Router();
const M = "san-pham";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listProductsController);
router.post("/", requireModulePermission(M, "create"), validateBody(createProductSchema), createProductController);

router.get("/:id", requireModulePermission(M, "read"), getProductDetailController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateProductSchema), updateProductController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteProductController);
router.post("/:id/bom", requireModulePermission(M, "update"), validateBody(upsertProductBomSchema), upsertProductBomController);
router.put(
  "/:id/bom/:materialId",
  requireModulePermission(M, "update"),
  validateBody(updateProductBomSchema),
  updateProductBomController,
);
router.delete("/:id/bom/:materialId", requireModulePermission(M, "update"), deleteProductBomController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
