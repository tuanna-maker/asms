import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../lib/errors/HttpError";

export function requireRoles(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) throw new HttpError(401, "Missing role");
    if (!roles.includes(userRole)) throw new HttpError(403, "Forbidden");
    return next();
  };
}

// Compatibility with requested middleware name: `requireRole(...roles)`
export function requireRole(...roles: string[]) {
  return requireRoles(roles);
}

