import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createDocumentSchema,
  documentIdParamSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema,
} from "./schema";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentDetailController,
  listDocumentsController,
  updateDocumentController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician", "sales"];

router.get("/", requireRoles(readRoles), listDocumentsController);
router.get("/:id", requireRoles(readRoles), getDocumentDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createDocumentSchema), createDocumentController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateDocumentSchema), updateDocumentController);
router.delete("/:id", requireRoles(writeRoles), deleteDocumentController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

