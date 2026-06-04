import { Router } from "express";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createController,
  deleteController,
  listController,
  updateController,
} from "./controller";
import { createAnniversarySchema, updateAnniversarySchema } from "./schema";

const router = Router();
const M = "khach-hang.loyalty";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listController);
router.post("/", requireModulePermission(M, "create"), validateBody(createAnniversarySchema), createController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateAnniversarySchema), updateController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteController);

export default router;
