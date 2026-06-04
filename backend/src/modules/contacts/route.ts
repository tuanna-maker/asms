import { Router } from "express";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
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
const M = "khach-hang.lien-he";

router.use(requireAuth);

router.get("/", requireModulePermission(M, "read"), listContactsController);
router.get("/:id", requireModulePermission(M, "read"), getContactDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createContactSchema), createContactController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateContactSchema), updateContactController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteContactController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
