import { Router } from "express";
import fs from "fs";
import path from "path";

import multer from "multer";

import { requireAuth, requireModulePermission } from "../../middleware/authJwt";

import {
  deleteDocumentController,
  listDocumentsController,
  uploadDocumentController,
} from "./controller";

const router = Router({ mergeParams: true });
const M = "tai-lieu";

router.use(requireAuth);

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

router.get("/:id/documents", requireModulePermission(M, "read"), listDocumentsController);
router.post(
  "/:id/documents",
  requireModulePermission(M, "create"),
  upload.single("file"),
  uploadDocumentController,
);
router.delete("/:id/documents/:docId", requireModulePermission(M, "delete"), deleteDocumentController);

export default router;
