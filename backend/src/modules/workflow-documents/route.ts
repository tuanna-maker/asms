import { Router } from "express";
import fs from "fs";
import path from "path";

import multer from "multer";

import { requireAuth, requireRoles } from "../../middleware/authJwt";

import {
  deleteDocumentController,
  listDocumentsController,
  uploadDocumentController,
} from "./controller";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const readRoles = ["admin", "manager", "technician", "sales", "viewer"];
const writeRoles = ["admin", "manager", "technician", "sales"];

const uploadRoot = path.join(process.cwd(), "uploads", "workflow");
fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const instanceId = String(req.params.id ?? "misc").replace(/[^a-zA-Z0-9_-]/g, "");
      const dir = path.join(uploadRoot, instanceId || "misc");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const base = path
        .parse(file.originalname)
        .name.replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 80);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${base || "file"}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = new Set([
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".csv",
      ".txt",
    ]);
    if (!allowed.has(ext)) return cb(new Error("Định dạng tệp không hỗ trợ"));
    return cb(null, true);
  },
});

router.get("/:id/documents", requireRoles(readRoles), listDocumentsController);
router.post(
  "/:id/documents",
  requireRoles(writeRoles),
  upload.single("file"),
  uploadDocumentController,
);
router.delete("/:id/documents/:docId", requireRoles(writeRoles), deleteDocumentController);

export default router;
