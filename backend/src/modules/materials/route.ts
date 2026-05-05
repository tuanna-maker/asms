import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician"];
const writeRoles = ["admin", "manager", "technician"];

router.get("/", requireRoles(readRoles), listMaterialsController);
router.get("/transfers", requireRoles(readRoles), listMaterialTransfersController);
router.get("/:id", requireRoles(readRoles), getMaterialDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createMaterialSchema), createMaterialController);
router.post("/transfers", requireRoles(writeRoles), validateBody(createMaterialTransferSchema), createMaterialTransferController);
router.put(
  "/transfers/:id",
  requireRoles(writeRoles),
  validateBody(updateMaterialTransferSchema),
  updateMaterialTransferController
);
router.delete("/transfers/:id", requireRoles(writeRoles), deleteMaterialTransferController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateMaterialSchema), updateMaterialController);
router.delete("/:id", requireRoles(writeRoles), deleteMaterialController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

