import type { Request, Response } from "express";

export function notImplementedHandler(_req: Request, res: Response) {
  return res.status(501).json({
    success: false,
    data: null,
    message: "Not implemented",
  });
}

