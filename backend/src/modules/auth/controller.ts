import type { Request, Response } from "express";
import { loginService, logoutService, registerService, refreshService } from "./service";
import { sendSuccess } from "../../lib/response";

export async function loginController(req: Request, res: Response) {
  const data = await loginService(req.body as any);
  return sendSuccess(res, data, "Login successful");
}

export async function registerController(req: Request, res: Response) {
  const data = await registerService(req.body as any);
  return sendSuccess(res, data, "Register successful");
}

export async function refreshController(req: Request, res: Response) {
  const data = await refreshService(req.body as any);
  return sendSuccess(res, data, "Token refreshed");
}

export async function logoutController(req: Request, res: Response) {
  const data = await logoutService(req.body as any);
  return sendSuccess(res, data, "Logged out");
}

