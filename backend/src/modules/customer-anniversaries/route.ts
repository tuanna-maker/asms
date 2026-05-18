import { Router } from "express";

import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createController,
  deleteController,
  listController,
  updateController,
} from "./controller";
import { createAnniversarySchema, updateAnniversarySchema } from "./schema";

const router = Router();
router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "sales", "viewer"];
const writeRoles = ["admin", "manager", "sales"];

router.get("/", requireRoles(readRoles), listController);
router.post("/", requireRoles(writeRoles), validateBody(createAnniversarySchema), createController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateAnniversarySchema), updateController);
router.delete("/:id", requireRoles(writeRoles), deleteController);

export default router;
