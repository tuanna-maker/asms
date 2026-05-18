import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
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

router.use(requireAuth);

const readRoles = ["admin", "manager", "viewer", "sales", "technician"];
const writeRoles = ["admin", "manager", "sales"];

router.get("/", requireRoles(readRoles), listContractsController);
router.get("/:id/products", requireRoles(readRoles), getContractProductsController);
router.get("/:id", requireRoles(readRoles), getContractDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createContractSchema), createContractController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateContractSchema), updateContractController);
router.put("/:id/products", requireRoles(writeRoles), validateBody(setContractProductsSchema), setContractProductsController);
router.put(
  "/:id/products/:productId",
  requireRoles(writeRoles),
  validateBody(updateContractProductSchema),
  updateContractProductController,
);
router.delete("/:id", requireRoles(writeRoles), deleteContractController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

