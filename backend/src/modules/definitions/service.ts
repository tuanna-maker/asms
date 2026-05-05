import type { DataDefinition } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export type DefinitionDTO = Pick<
  DataDefinition,
  "id" | "category" | "code" | "label" | "sortOrder" | "isActive" | "createdAt" | "updatedAt"
>;

function toDTO(row: DataDefinition): DefinitionDTO {
  const { id, category, code, label, sortOrder, isActive, createdAt, updatedAt } = row;
  return { id, category, code, label, sortOrder, isActive, createdAt, updatedAt };
}

export async function listDefinitionsService(params: {
  category: string;
  includeInactive: boolean;
}): Promise<DefinitionDTO[]> {
  const rows = await prisma.dataDefinition.findMany({
    where: {
      deletedAt: null,
      category: params.category,
      ...(params.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });
  return rows.map(toDTO);
}

export async function createDefinitionService(input: {
  category: string;
  code: string;
  label: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<DefinitionDTO> {
  const existing = await prisma.dataDefinition.findFirst({
    where: { category: input.category, code: input.code.trim(), deletedAt: null },
  });
  if (existing) throw new HttpError(409, "Đã tồn tại giá trị với nhóm và mã này");

  const row = await prisma.dataDefinition.create({
    data: {
      category: input.category.trim(),
      code: input.code.trim(),
      label: input.label.trim(),
      sortOrder: input.sortOrder ?? 0,
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    },
  });
  return toDTO(row);
}

export async function updateDefinitionService(
  id: string,
  input: {
    code?: string;
    label?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
): Promise<DefinitionDTO> {
  const row = await prisma.dataDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy định nghĩa");

  const codeNew = input.code !== undefined ? input.code.trim() : row.code;
  if (codeNew !== row.code) {
    const dup = await prisma.dataDefinition.findFirst({
      where: { category: row.category, code: codeNew, deletedAt: null, NOT: { id } },
    });
    if (dup) throw new HttpError(409, "Mã đã được dùng trong nhóm này");
  }

  const labelNew = input.label !== undefined ? input.label.trim() : row.label;
  const updated = await prisma.dataDefinition.update({
    where: { id },
    data: {
      code: codeNew,
      label: labelNew,
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  return toDTO(updated);
}

export async function softDeleteDefinitionService(id: string): Promise<{ id: string }> {
  const row = await prisma.dataDefinition.findFirst({ where: { id, deletedAt: null } });
  if (!row) throw new HttpError(404, "Không tìm thấy định nghĩa");

  await prisma.dataDefinition.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  return { id };
}
