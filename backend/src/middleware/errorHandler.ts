import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors/HttpError";
import { isDatabaseUnreachableError } from "../lib/db-url";
import { env } from "../config/env";

/**
 * Nhận diện Prisma Client error theo mã chuẩn.
 * Tránh để FK constraint / not found trở thành 500 (lộ thông tin DB).
 */
function asPrismaError(err: unknown): { code: string; meta?: unknown } | null {
  if (!err || typeof err !== "object") return null;
  const obj = err as { code?: unknown; meta?: unknown };
  if (typeof obj.code === "string" && obj.code.startsWith("P")) {
    return { code: obj.code, meta: obj.meta };
  }
  return null;
}

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

  const prismaErr = asPrismaError(err);
  if (prismaErr) {
    // P2003 = Foreign key constraint failed → 400 (input invalid)
    // P2025 = Record not found → 404
    // P2002 = Unique constraint failed → 409
    const mapping: Record<string, { status: number; message: string }> = {
      P2003: { status: 400, message: "Dữ liệu tham chiếu không hợp lệ (khóa ngoại)." },
      P2025: { status: 404, message: "Không tìm thấy bản ghi." },
      P2002: { status: 409, message: "Dữ liệu đã tồn tại (trùng khóa duy nhất)." },
    };
    const mapped = mapping[prismaErr.code];
    if (mapped) {
      return res.status(mapped.status).json({
        success: false,
        data: { prismaCode: prismaErr.code, meta: prismaErr.meta ?? null },
        message: mapped.message,
      });
    }
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

