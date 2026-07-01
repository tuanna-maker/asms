import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors/HttpError";
import { isDatabaseUnreachableError } from "../lib/db-url";
import { env } from "../config/env";

export default function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      data: err.details ?? null,
      message: err.message,
    });
  }

  if (isDatabaseUnreachableError(err)) {
    return res.status(503).json({
      success: false,
      data: null,
      message:
        "Không kết nối được PostgreSQL. Kiểm tra DATABASE_URL, VPN/mạng, hoặc chạy DB local: docker compose -f docker-compose.local-db.yml up -d",
    });
  }

  if (env.NODE_ENV === "production") {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
    });
  }

  return res.status(500).json({
    success: false,
    data: null,
    message: err instanceof Error ? err.message : "Internal Server Error",
  });
}

