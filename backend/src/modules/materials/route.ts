import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createMaterialTransferSchema,
  createMaterialSchema,
  updateMaterialSchema,
  updateMaterialTransferSchema,
} from "./schema";
import {
  createMaterialTransferController,
  createMaterialController,
  deleteMaterialController,
  deleteMaterialTransferController,
  getMaterialDetailController,
  listMaterialTransfersController,
  listMaterialsController,
  updateMaterialController,
  updateMaterialTransferController,
} from "./controller";

const router = Router();
const M = "vat-tu";
const T = "vat-tu.dieu-chuyen";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listMaterialsController);
router.get("/transfers", requireModulePermission(T, "read"), listMaterialTransfersController);
router.get("/:id", requireModulePermission(M, "read"), getMaterialDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createMaterialSchema), createMaterialController);
router.post(
  "/transfers",
  requireModulePermission(T, "create"),
  validateBody(createMaterialTransferSchema),
  createMaterialTransferController,
);
router.put(
  "/transfers/:id",
  requireModulePermission(T, "update"),
  validateBody(updateMaterialTransferSchema),
  updateMaterialTransferController,
);
router.delete("/transfers/:id", requireModulePermission(T, "delete"), deleteMaterialTransferController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateMaterialSchema), updateMaterialController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteMaterialController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
