import { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, message?: string) {
  return res.json({
    success: true,
    data,
    message,
  });
}

export function sendError(res: Response, statusCode: number, message: string, data: unknown = null) {
  return res.status(statusCode).json({
    success: false,
    data,
    message,
  });
}

