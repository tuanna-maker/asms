import type { Prisma, Role } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export type RoleDTO = Pick<
  Role,
  "id" | "code" | "name" | "description" | "isSystem" | "isActive" | "createdAt" | "updatedAt"
> & { userCount: number };

const roleSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  isSystem: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { users: { where: { deletedAt: null } } } },
} satisfies Prisma.RoleSelect;

type RoleRow = Prisma.RoleGetPayload<{ select: typeof roleSelect }>;

function toDTO(row: RoleRow): RoleDTO {
  const { _count, ...rest } = row;
  return { ...rest, userCount: _count.users };
}

export async function listRolesService(filters: { search?: string; includeInactive?: boolean }) {
  const where: Prisma.RoleWhereInput = {
    deletedAt: null,
    ...(filters.includeInactive ? {} : { isActive: true }),
  };
  if (filters.search) {
    const s = filters.search.trim();
    if (s.length > 0) {
      where.OR = [
        { name: { contains: s, mode: "insensitive" } },
        { code: { contains: s, mode: "insensitive" } },
      ];
    }
  }
  const rows = await prisma.role.findMany({
    where,
    orderBy: [{ isSystem: "desc" }, { code: "asc" }],
    select: roleSelect,
  });
  return rows.map(toDTO);
}

export async function getRoleService(id: string) {
  const row = await prisma.role.findFirst({
    where: { id, deletedAt: null },
    select: roleSelect,
  });
  if (!row) throw new HttpError(404, "Không tìm thấy vai trò");
  return toDTO(row);
}

export async function createRoleService(input: {
  code: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}) {
  const code = input.code.trim().toLowerCase();
  const dup = await prisma.role.findFirst({ where: { code }, select: { id: true } });
  if (dup) throw new HttpError(409, "Mã vai trò đã tồn tại");

  const row = await prisma.role.create({
    data: {
      code,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      isActive: input.isActive ?? true,
      isSystem: false,
    },
    select: roleSelect,
  });
  return toDTO(row);
}

export async function updateRoleService(
  id: string,
  input: { code?: string; name?: string; description?: string | null; isActive?: boolean },
) {
  const row = await prisma.role.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, code: true, isSystem: true },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy vai trò");

  const data: Prisma.RoleUpdateInput = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description?.trim() ?? null;
  if (input.isActive !== undefined) {
    if (row.isSystem && input.isActive === false) {
      throw new HttpError(400, "Không thể vô hiệu hoá vai trò hệ thống");
    }
    data.isActive = input.isActive;
  }
  if (input.code !== undefined) {
    const codeNew = input.code.trim().toLowerCase();
    if (codeNew !== row.code) {
      if (row.isSystem) throw new HttpError(400, "Không thể đổi mã vai trò hệ thống");
      const dup = await prisma.role.findFirst({
        where: { code: codeNew, NOT: { id } },
        select: { id: true },
      });
      if (dup) throw new HttpError(409, "Mã vai trò đã tồn tại");
      data.code = codeNew;
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.role.update({ where: { id }, data });
  }
  return getRoleService(id);
}

export async function softDeleteRoleService(id: string) {
  const row = await prisma.role.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, isSystem: true, _count: { select: { users: { where: { deletedAt: null } } } } },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy vai trò");
  if (row.isSystem) throw new HttpError(400, "Không thể xoá vai trò hệ thống");
  if (row._count.users > 0) {
    throw new HttpError(400, "Vai trò đang gán cho người dùng — gỡ trước khi xoá");
  }

  await prisma.role.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  return { id };
}
