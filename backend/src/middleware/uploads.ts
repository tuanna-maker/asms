import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response, Router } from "express";
import express from "express";
import jwt from "jsonwebtoken";

import { HttpError } from "../lib/errors/HttpError";
import { env } from "../config/env";

function verifyUploadAccess(req: Request): void {
  const header = req.headers.authorization;
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const raw = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : header ?? queryToken;

  if (!raw) throw new HttpError(401, "Authentication required to access uploads");

  const secret = env.JWT_SECRET;
  if (!secret) throw new HttpError(500, "JWT_SECRET is not configured");

  try {
    const payload = jwt.verify(raw, secret) as { sub?: string; id?: string; role?: string };
    const id = payload.sub ?? payload.id;
    if (!id || !payload.role) throw new HttpError(401, "Invalid token payload");
    req.user = { id, role: payload.role };
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Invalid or expired token");
  }
}

function isInlinePreviewable(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
    ".pdf",
    ".txt",
  ].includes(ext);
}

export function createProtectedUploadsRouter(): Router {
  const router = express.Router();
  const uploadRoot = path.resolve(process.cwd(), "uploads");

  router.get(/.*/, (req: Request, res: Response, next: NextFunction) => {
    try {
      verifyUploadAccess(req);
    } catch (e) {
      return next(e);
    }

    const rel = req.path.replace(/^\//, "");
    if (!rel || rel.includes("..")) {
      return res.status(400).json({ success: false, data: null, message: "Invalid file path" });
    }

    const filePath = path.join(uploadRoot, rel);
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(uploadRoot)) {
      return res.status(400).json({ success: false, data: null, message: "Invalid file path" });
    }

    if (!fs.existsSync(normalized) || !fs.statSync(normalized).isFile()) {
      return res.status(404).json({ success: false, data: null, message: "File not found" });
    }

    const fileName = path.basename(normalized);
    // Ảnh / PDF mở trực tiếp trên trình duyệt; còn lại vẫn cho tải về.
    if (isInlinePreviewable(normalized)) {
      res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    } else {
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    }

    return res.sendFile(normalized);
  });

  return router;
}
