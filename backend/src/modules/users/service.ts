import bcrypt from "bcryptjs";
import type { Prisma, UserStatus } from "@prisma/client";
import type { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import { ensureNotificationPreferencesForUser } from "../notification-preferences/service";
import { createUserSchema } from "./schema";

const publicUserSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  role: { select: { code: true, name: true } },
} satisfies Prisma.UserSelect;

async function resolveRoleId(roleCode: string) {
  const role = await prisma.role.findFirst({
    where: { deletedAt: null, code: roleCode },
    select: { id: true },
  });
  if (!role) throw new HttpError(400, "Invalid role");
  return role.id;
}

async function resolveUserId(idOrEmail: string) {
  const user = await prisma.user.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrEmail }, { email: idOrEmail }] },
    select: { id: true },
  });
  if (!user) throw new HttpError(404, "User not found");
  return user.id;
}

export async function listUsersService(filters: {
  status?: string;
  roleCode?: string;
  search?: string;
}) {
  const where: Prisma.UserWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status as UserStatus } : {}),
    ...(filters.roleCode ? { role: { code: filters.roleCode } } : {}),
  };

  if (filters.search) {
    const s = filters.search.trim();
    if (s.length > 0) {
      where.OR = [
        { fullName: { contains: s, mode: "insensitive" } },
        { email: { contains: s, mode: "insensitive" } },
      ];
    }
  }

  return prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: publicUserSelect,
  });
}

export async function getUserDetailService(idOrEmail: string) {
  const resolvedId = await resolveUserId(idOrEmail);
  const user = await prisma.user.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: publicUserSelect,
  });
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

type CreateUserInput = z.infer<typeof createUserSchema>;

export async function createUserService(payload: CreateUserInput) {
  const existing = await prisma.user.findFirst({
    where: { email: payload.email, deletedAt: null },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, "Email already exists");

  const roleId = await resolveRoleId(payload.roleCode);
  const passwordHash = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      roleId,
      status: (payload.status ?? "active") as UserStatus,
    },
    select: publicUserSelect,
  });
  await ensureNotificationPreferencesForUser(user.id);
  return user;
}

export async function updateUserService(idOrEmail: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveUserId(idOrEmail);

  const data: Record<string, unknown> = {};

  if (payload.fullName !== undefined) data.fullName = payload.fullName;

  if (payload.email !== undefined) {
    const email = payload.email as string;
    const dup = await prisma.user.findFirst({
      where: { email, deletedAt: null, NOT: { id: resolvedId } },
      select: { id: true },
    });
    if (dup) throw new HttpError(409, "Email already exists");
    data.email = email;
  }

  if (payload.password !== undefined) {
    data.passwordHash = await bcrypt.hash(payload.password as string, 10);
  }

  if (payload.roleCode !== undefined) {
    data.roleId = await resolveRoleId(payload.roleCode as string);
  }

  if (payload.status !== undefined) {
    data.status = payload.status;
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: resolvedId }, data: data as object });
  }

  return getUserDetailService(resolvedId);
}

export async function softDeleteUserService(idOrEmail: string, actorId?: string | null) {
  const resolvedId = await resolveUserId(idOrEmail);
  if (actorId && actorId === resolvedId) {
    throw new HttpError(400, "Cannot delete your own account");
  }

  const now = new Date();
  const n = await prisma.user.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "User not found");

  await prisma.refreshToken.updateMany({
    where: { userId: resolvedId, deletedAt: null },
    data: { deletedAt: now, revokedAt: now },
  });

  return { id: resolvedId };
}
