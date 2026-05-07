import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
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
  uploadDocumentController,
  updateDocumentController,
} from "./controller";

const router = Router();

router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "viewer", "sales"];
const writeRoles = ["admin", "manager", "technician", "sales"];
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

router.post("/upload", requireRoles(writeRoles), upload.single("file"), uploadDocumentController);

router.get("/", requireRoles(readRoles), listDocumentsController);
router.get("/:id", requireRoles(readRoles), getDocumentDetailController);

router.post("/", requireRoles(writeRoles), validateBody(createDocumentSchema), createDocumentController);
router.put("/:id", requireRoles(writeRoles), validateBody(updateDocumentSchema), updateDocumentController);
router.delete("/:id", requireRoles(writeRoles), deleteDocumentController);

router.all(/.*/, (_req, res) => res.status(404).json({ success: false, data: null, message: "Not found" }));

export default router;

