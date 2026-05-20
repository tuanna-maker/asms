import type { ContractClause, ContractClauseGroup, Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

type UserMeta = { id: string; fullName: string } | null;

type ClauseRow = ContractClause & {
  createdBy: UserMeta;
  updatedBy: UserMeta;
};

type GroupMemberRow = {
  clauseId: string;
  sortOrder: number;
  clause: {
    id: string;
    code: string;
    title: string;
    content: string;
    isActive: boolean;
    sortOrder: number;
  };
};

export type ClauseDTO = {
  id: string;
  code: string;
  title: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserMeta;
  updatedBy: UserMeta;
};

export type ClauseGroupDTO = {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserMeta;
  updatedBy: UserMeta;
  members: GroupMemberRow[];
};

const clauseSelect = {
  id: true,
  code: true,
  title: true,
  content: true,
  sortOrder: true,
  isActive: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ContractClauseSelect;

const groupSelect = {
  id: true,
  code: true,
  label: true,
  sortOrder: true,
  isActive: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, fullName: true } },
  updatedBy: { select: { id: true, fullName: true } },
  members: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      clauseId: true,
      sortOrder: true,
      clause: {
        select: {
          id: true,
          code: true,
          title: true,
          content: true,
          isActive: true,
          sortOrder: true,
          deletedAt: true,
        },
      },
    },
  },
} satisfies Prisma.ContractClauseGroupSelect;

function toClauseDTO(row: ClauseRow): ClauseDTO {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    content: row.content,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

function toGroupDTO(row: ContractClauseGroup & { members: GroupMemberRow[]; createdBy: UserMeta; updatedBy: UserMeta }): ClauseGroupDTO {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    isSystem: row.isSystem,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    members: row.members
      .filter((m) => m.clause && !("deletedAt" in m.clause && m.clause.deletedAt))
      .map((m) => ({
        clauseId: m.clauseId,
        sortOrder: m.sortOrder,
        clause: {
          id: m.clause.id,
          code: m.clause.code,
          title: m.clause.title,
          content: m.clause.content,
          isActive: m.clause.isActive,
          sortOrder: m.clause.sortOrder,
        },
      })),
  };
}

export async function listClausesService(includeInactive: boolean): Promise<ClauseDTO[]> {
  const rows = await prisma.contractClause.findMany({
    where: {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: clauseSelect,
  });
  return rows.map((r) => toClauseDTO(r as ClauseRow));
}

export async function createClauseService(input: {
  code: string;
  title: string;
  content: string;
  sortOrder?: number;
  isActive?: boolean;
  actorId?: string | null;
}): Promise<ClauseDTO> {
  const code = input.code.trim();
  const dup = await prisma.contractClause.findFirst({ where: { code, deletedAt: null } });
  if (dup) throw new HttpError(409, "Mã điều khoản đã tồn tại");

  const row = await prisma.contractClause.create({
    data: {
      code,
      title: input.title.trim(),
      content: input.content.trim(),
      sortOrder: input.sortOrder ?? 0,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.actorId ? { createdById: input.actorId, updatedById: input.actorId } : {}),
    },
    select: clauseSelect,
  });
  return toClauseDTO(row as ClauseRow);
}

export async function updateClauseService(
  id: string,
  input: {
    code?: string;
    title?: string;
    content?: string;
    sortOrder?: number;
    isActive?: boolean;
    actorId?: string | null;
  },
): Promise<ClauseDTO> {
  const row = await prisma.contractClause.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy điều khoản");

  const codeNew = input.code !== undefined ? input.code.trim() : row.code;
  if (codeNew !== row.code) {
    const dup = await prisma.contractClause.findFirst({
      where: { code: codeNew, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(409, "Mã điều khoản đã tồn tại");
  }

  const updated = await prisma.contractClause.update({
    where: { id },
    data: {
      code: codeNew,
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { content: input.content.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.actorId ? { updatedById: input.actorId } : {}),
    },
    select: clauseSelect,
  });
  return toClauseDTO(updated as ClauseRow);
}

export async function softDeleteClauseService(id: string): Promise<{ id: string }> {
  const row = await prisma.contractClause.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy điều khoản");

  const usage = await countClauseUsage(id);
  if (usage.count > 0) {
    throw new HttpError(409, `Còn ${usage.count} hợp đồng đang dùng điều khoản này.`);
  }

  await prisma.contractClause.update({ where: { id }, data: { deletedAt: new Date() } });
  return { id };
}

export async function reorderClausesService(orderedIds: string[]): Promise<ClauseDTO[]> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.contractClause.updateMany({
        where: { id, deletedAt: null },
        data: { sortOrder: index },
      }),
    ),
  );
  return listClausesService(true);
}

export async function getClauseUsageService(id: string) {
  const count = (await countClauseUsage(id)).count;
  return { count, entities: count > 0 ? ["Hợp đồng"] : [] };
}

async function countClauseUsage(clauseId: string) {
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null, clauseIds: { has: clauseId } },
    select: { id: true },
  });
  return { count: contracts.length };
}

export async function listClauseGroupsService(includeInactive: boolean): Promise<ClauseGroupDTO[]> {
  const rows = await prisma.contractClauseGroup.findMany({
    where: {
      deletedAt: null,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: groupSelect,
  });
  return rows.map((r) => toGroupDTO(r as Parameters<typeof toGroupDTO>[0]));
}

export async function createClauseGroupService(input: {
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
  actorId?: string | null;
}): Promise<ClauseGroupDTO> {
  const code = input.code.trim();
  const dup = await prisma.contractClauseGroup.findFirst({ where: { code, deletedAt: null } });
  if (dup) throw new HttpError(409, "Mã nhóm đã tồn tại");

  const row = await prisma.contractClauseGroup.create({
    data: {
      code,
      label: input.label.trim(),
      sortOrder: input.sortOrder ?? 0,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.actorId ? { createdById: input.actorId, updatedById: input.actorId } : {}),
    },
    select: groupSelect,
  });
  return toGroupDTO(row as Parameters<typeof toGroupDTO>[0]);
}

export async function updateClauseGroupService(
  id: string,
  input: {
    code?: string;
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
    actorId?: string | null;
  },
): Promise<ClauseGroupDTO> {
  const row = await prisma.contractClauseGroup.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy nhóm");

  const codeNew = input.code !== undefined ? input.code.trim() : row.code;
  if (codeNew !== row.code) {
    const dup = await prisma.contractClauseGroup.findFirst({
      where: { code: codeNew, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(409, "Mã nhóm đã tồn tại");
  }

  const updated = await prisma.contractClauseGroup.update({
    where: { id },
    data: {
      code: codeNew,
      ...(input.label !== undefined ? { label: input.label.trim() } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.actorId ? { updatedById: input.actorId } : {}),
    },
    select: groupSelect,
  });
  return toGroupDTO(updated as Parameters<typeof toGroupDTO>[0]);
}

export async function softDeleteClauseGroupService(id: string): Promise<{ id: string }> {
  const row = await prisma.contractClauseGroup.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy nhóm");

  await prisma.$transaction([
    prisma.contractClauseGroupMember.deleteMany({ where: { groupId: id } }),
    prisma.contractClauseGroup.update({ where: { id }, data: { deletedAt: new Date() } }),
  ]);
  return { id };
}

export async function reorderClauseGroupsService(orderedIds: string[]): Promise<ClauseGroupDTO[]> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.contractClauseGroup.updateMany({
        where: { id, deletedAt: null },
        data: { sortOrder: index },
      }),
    ),
  );
  return listClauseGroupsService(true);
}

export async function setClauseGroupMembersService(
  groupId: string,
  clauseIds: string[],
): Promise<ClauseGroupDTO> {
  const group = await prisma.contractClauseGroup.findFirst({ where: { id: groupId, deletedAt: null } });
  if (!group) throw new HttpError(404, "Không tìm thấy nhóm");

  const unique = [...new Set(clauseIds)];
  if (unique.length > 0) {
    const found = await prisma.contractClause.findMany({
      where: { id: { in: unique }, deletedAt: null },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw new HttpError(400, "Một hoặc nhiều điều khoản không hợp lệ");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.contractClauseGroupMember.deleteMany({ where: { groupId } });
    if (unique.length > 0) {
      await tx.contractClauseGroupMember.createMany({
        data: unique.map((clauseId, index) => ({
          groupId,
          clauseId,
          sortOrder: index,
        })),
      });
    }
  });

  const row = await prisma.contractClauseGroup.findFirst({
    where: { id: groupId },
    select: groupSelect,
  });
  if (!row) throw new HttpError(404, "Không tìm thấy nhóm");
  return toGroupDTO(row as Parameters<typeof toGroupDTO>[0]);
}
