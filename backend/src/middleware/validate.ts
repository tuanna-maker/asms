import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { HttpError } from "../lib/errors/HttpError";
import { formatZodError } from "../lib/errors/formatValidationError";

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const { message, details } = formatZodError(result.error);
      throw new HttpError(400, message, details);
    }
    req.body = result.data;
    return next();
  };
}

