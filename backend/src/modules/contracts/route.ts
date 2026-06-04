import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createContractSchema,
  setContractProductsSchema,
  updateContractProductSchema,
  updateContractSchema,
} from "./schema";
import {
  createContractController,
  deleteContractController,
  getContractDetailController,
  getContractProductsController,
  listContractsController,
  setContractProductsController,
  updateContractController,
  updateContractProductController,
} from "./controller";

const router = Router();
const M = "hop-dong";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listContractsController);
router.get("/:id/products", requireModulePermission(M, "read"), getContractProductsController);
router.get("/:id", requireModulePermission(M, "read"), getContractDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createContractSchema), createContractController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateContractSchema), updateContractController);
router.put(
  "/:id/products",
  requireModulePermission(M, "update"),
  validateBody(setContractProductsSchema),
  setContractProductsController,
);
router.put(
  "/:id/products/:productId",
  requireModulePermission(M, "update"),
  validateBody(updateContractProductSchema),
  updateContractProductController,
);
router.delete("/:id", requireModulePermission(M, "delete"), deleteContractController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
