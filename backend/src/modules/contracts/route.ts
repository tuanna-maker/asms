import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createContractSchema, updateContractSchema } from "./schema";
import {
  createContractController,
  deleteContractController,
  getContractDetailController,
  listContractsController,
  updateContractController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "viewer", "sales"];
const writeRoles = ["admin", "manager", "sales"];

router.get("/", requireRoles(readRoles), listContractsController);
router.get("/:id", requireRoles(readRoles), getContractDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createContractSchema), createContractController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateContractSchema), updateContractController);
router.delete("/:id", requireRoles(writeRoles), deleteContractController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

