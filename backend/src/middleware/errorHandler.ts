import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors/HttpError";

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

  // Fallback for unknown errors
  return res.status(500).json({
    success: false,
    data: null,
    message: err instanceof Error ? err.message : "Internal Server Error",
  });
}

