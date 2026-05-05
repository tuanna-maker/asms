import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { HttpError } from "../lib/errors/HttpError";

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new HttpError(400, "Invalid request body", result.error.flatten());
    }
    req.body = result.data;
    return next();
  };
}

