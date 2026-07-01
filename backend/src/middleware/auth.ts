import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { HttpError } from "../lib/errors/HttpError";
import { env } from "../config/env";

function getJwtSecret(): string {
  return env.JWT_SECRET ?? "";
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) throw new HttpError(401, "Thiếu header Authorization");

  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : header;
  const secret = getJwtSecret();
  if (!secret) throw new HttpError(500, "JWT_SECRET chưa được cấu hình");

  try {
    const payload = jwt.verify(token, secret) as { sub?: string; role?: string; id?: string };
    const id = payload.sub ?? payload.id;
    const role = payload.role;

    if (!id || !role) throw new HttpError(401, "Token không hợp lệ");

    req.user = { id, role };
    return next();
  } catch (_e) {
    throw new HttpError(401, "Token không hợp lệ hoặc đã hết hạn");
  }
}


