import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { env } from "../../config/env";

import { loginSchema, registerSchema } from "./schema";

type LoginPayload = z.infer<typeof loginSchema>;
type RegisterPayload = z.infer<typeof registerSchema>;

const ACCESS_TOKEN_EXPIRES_IN = "7d";
const REFRESH_TOKEN_TTL_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRefreshTokenRaw() {
  return crypto.randomBytes(32).toString("hex");
}

const VIEWER_ROLE = { code: "viewer", name: "Xem" } as const;

const ROLE_SEED: Record<string, { code: string; name: string }> = {
  admin: { code: "admin", name: "Quản trị" },
  manager: { code: "manager", name: "Quản lý" },
  technician: { code: "technician", name: "Kỹ thuật viên" },
  viewer: { code: VIEWER_ROLE.code, name: VIEWER_ROLE.name },
  sales: { code: "sales", name: "Nhân viên bán hàng" },
};

async function ensureRole(roleCode: string) {
  const seed = ROLE_SEED[roleCode] ?? VIEWER_ROLE;
  const role = await prisma.role.upsert({
    where: { code: seed.code },
    update: { name: seed.name },
    create: { code: seed.code, name: seed.name },
  });
  return role;
}

function signToken(args: { userId: string; roleCode: string }) {
  if (!env.JWT_SECRET) throw new HttpError(500, "JWT_SECRET is not configured");
  return jwt.sign(
    { role: args.roleCode },
    env.JWT_SECRET,
    {
      subject: args.userId,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );
}

export async function loginService(payload: LoginPayload) {
  const user = await prisma.user.findFirst({
    where: { email: payload.email, deletedAt: null },
    select: {
      id: true,
      fullName: true,
      email: true,
      passwordHash: true,
      role: { select: { code: true } },
    },
  });

  if (!user) throw new HttpError(401, "Invalid email or password");

  const ok = await bcrypt.compare(payload.password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid email or password");

  const token = signToken({ userId: user.id, roleCode: user.role.code });
  const refreshTokenRaw = generateRefreshTokenRaw();
  const refreshTokenHash = hashToken(refreshTokenRaw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    token,
    refreshToken: refreshTokenRaw,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.code,
    },
  };
}

export async function registerService(payload: RegisterPayload) {
  const roleCode = payload.roleCode ?? "viewer";

  const existing = await prisma.user.findFirst({
    where: { email: payload.email, deletedAt: null },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, "Email already exists");

  const role = await ensureRole(roleCode);
  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      roleId: role.id,
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
    },
    select: { id: true, fullName: true, email: true, role: { select: { code: true } } },
  });

  const token = signToken({ userId: user.id, roleCode: user.role.code });
  const refreshTokenRaw = generateRefreshTokenRaw();
  const refreshTokenHash = hashToken(refreshTokenRaw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    token,
    refreshToken: refreshTokenRaw,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.code,
    },
  };
}

export async function refreshService(payload: { refreshToken: string }) {
  const now = new Date();
  const tokenHash = hashToken(payload.refreshToken);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      deletedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      user: { select: { id: true, fullName: true, email: true, role: { select: { code: true } } } },
    },
  });

  if (!stored?.user) throw new HttpError(401, "Invalid or expired refresh token");

  // Rotate refresh token: revoke old and issue new.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: now } });

  const refreshTokenRaw = generateRefreshTokenRaw();
  const refreshTokenHash = hashToken(refreshTokenRaw);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { tokenHash: refreshTokenHash, userId: stored.user.id, expiresAt },
  });

  const accessToken = signToken({ userId: stored.user.id, roleCode: stored.user.role.code });

  return {
    token: accessToken,
    refreshToken: refreshTokenRaw,
    user: {
      id: stored.user.id,
      fullName: stored.user.fullName,
      email: stored.user.email,
      role: stored.user.role.code,
    },
  };
}

export async function logoutService(payload: { refreshToken: string }) {
  const now = new Date();
  const tokenHash = hashToken(payload.refreshToken);

  const stored = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      deletedAt: null,
      revokedAt: null,
    },
    select: { id: true },
  });

  // Logout should be idempotent: if token not found, still return success.
  if (stored) {
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: now } });
  }

  return { revoked: Boolean(stored) };
}

