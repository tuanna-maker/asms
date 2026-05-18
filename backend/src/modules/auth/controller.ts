import type { Request, Response } from "express";
import {
  hashToken,
  listSessionsService,
  loginService,
  logoutAllService,
  logoutService,
  refreshService,
  registerService,
  revokeSessionService,
} from "./service";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";
import { HttpError } from "../../lib/errors/HttpError";

function getMeta(req: Request) {
  const fwd = req.headers["x-forwarded-for"];
  let ip: string | null = null;
  if (typeof fwd === "string" && fwd.length > 0) ip = fwd.split(",")[0]!.trim();
  else if (Array.isArray(fwd) && fwd.length > 0) ip = fwd[0] ?? null;
  else ip = req.ip ?? null;
  const ua = typeof req.headers["user-agent"] === "string" ? (req.headers["user-agent"] as string) : null;
  return { userAgent: ua, ip };
}

export async function loginController(req: Request, res: Response) {
  const data = await loginService(req.body as Parameters<typeof loginService>[0], getMeta(req));
  req.user = { id: data.user.id, role: data.user.role };
  await writeAudit(req, {
    action: "login",
    entity: "auth",
    entityId: data.user.id,
    summary: `Đăng nhập ${data.user.email}`,
  });
  return sendSuccess(res, data, "Login successful");
}

export async function registerController(req: Request, res: Response) {
  const data = await registerService(req.body as Parameters<typeof registerService>[0]);
  req.user = { id: data.user.id, role: data.user.role };
  await writeAudit(req, {
    action: "create",
    entity: "user",
    entityId: data.user.id,
    summary: `Đăng ký người dùng ${data.user.email}`,
  });
  return sendSuccess(res, data, "Register successful");
}

export async function refreshController(req: Request, res: Response) {
  const data = await refreshService(req.body as Parameters<typeof refreshService>[0], getMeta(req));
  return sendSuccess(res, data, "Token refreshed");
}

export async function logoutController(req: Request, res: Response) {
  const data = await logoutService(req.body as Parameters<typeof logoutService>[0]);
  if (req.user?.id) {
    await writeAudit(req, {
      action: "logout",
      entity: "auth",
      entityId: req.user.id,
      summary: `Đăng xuất`,
    });
  }
  return sendSuccess(res, data, "Logged out");
}

function extractRefreshTokenFromBody(req: Request): string | null {
  const body = req.body as { refreshToken?: unknown } | undefined;
  if (body && typeof body.refreshToken === "string" && body.refreshToken.length > 0) {
    return body.refreshToken;
  }
  return null;
}

export async function listSessionsController(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Missing user");
  const raw = extractRefreshTokenFromBody(req);
  const currentHash = raw ? hashToken(raw) : null;
  const data = await listSessionsService(userId, currentHash);
  return sendSuccess(res, data);
}

export async function revokeSessionController(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Missing user");
  const id = String(req.params.id ?? "");
  if (!id) throw new HttpError(400, "Missing id");
  const data = await revokeSessionService(userId, id);
  await writeAudit(req, {
    action: "session_revoke",
    entity: "auth",
    entityId: userId,
    summary: `Thu hồi phiên ${id}`,
  });
  return sendSuccess(res, data, "Session revoked");
}

export async function logoutAllController(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) throw new HttpError(401, "Missing user");
  const raw = extractRefreshTokenFromBody(req);
  const exceptHash = raw ? hashToken(raw) : null;
  const data = await logoutAllService(userId, exceptHash);
  await writeAudit(req, {
    action: "logout_all",
    entity: "auth",
    entityId: userId,
    summary: `Đăng xuất tất cả thiết bị (${data.count})`,
  });
  return sendSuccess(res, data, "Logged out from all devices");
}

