import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { requireAuth, requireModulePermission } from "../../middleware/authJwt";
import { validateBody } from "../../middleware/validate";

import {
  createDocumentSchema,
  updateDocumentSchema,
} from "./schema";
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentDetailController,
  listDocumentsController,
  uploadDocumentController,
  updateDocumentController,
} from "./controller";

const router = Router();
const M = "tai-lieu";

router.use(requireAuth);

const uploadDir = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeBase = path
        .parse(file.originalname)
        .name
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 80);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${safeBase || "document"}${ext}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx", ".xls", ".xlsx", ".csv"]);
    if (!allowed.has(ext)) return cb(new Error("Unsupported file type"));
    return cb(null, true);
  },
});

router.post("/upload", requireModulePermission(M, "create"), upload.single("file"), uploadDocumentController);

router.get("/", requireModulePermission(M, "read"), listDocumentsController);
router.get("/:id", requireModulePermission(M, "read"), getDocumentDetailController);

router.post("/", requireModulePermission(M, "create"), validateBody(createDocumentSchema), createDocumentController);
router.put("/:id", requireModulePermission(M, "update"), validateBody(updateDocumentSchema), updateDocumentController);
router.delete("/:id", requireModulePermission(M, "delete"), deleteDocumentController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;
