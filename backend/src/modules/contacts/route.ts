import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import { createContactSchema, updateContactSchema } from "./schema";
import {
  createContactController,
  deleteContactController,
  getContactDetailController,
  listContactsController,
  updateContactController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "sales"];

router.get("/", requireRoles(readRoles), listContactsController);
router.get("/:id", requireRoles(readRoles), getContactDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createContactSchema), createContactController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateContactSchema), updateContactController);
router.delete("/:id", requireRoles(writeRoles), deleteContactController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
