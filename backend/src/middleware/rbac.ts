import type { NextFunction, Request, Response } from "express";

import { httpMethodToCrudAction } from "../config/api-module-map";
import { HttpError } from "../lib/errors/HttpError";
import {
  roleCanPerformAction,
  type CrudAction,
} from "../modules/role-permissions/service";

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

export function requireModulePermission(moduleKey: string, action: CrudAction) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) throw new HttpError(401, "Missing role");
    const allowed = await roleCanPerformAction(userRole, moduleKey, action);
    if (!allowed) throw new HttpError(403, "Forbidden");
    return next();
  };
}

export function requireHttpModulePermission(moduleKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const action = httpMethodToCrudAction(req.method);
    return requireModulePermission(moduleKey, action)(req, res, next);
  };
}

