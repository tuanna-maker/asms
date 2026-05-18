import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export async function assertActiveDefinitionCode(
  category: string,
  code: string,
  label: string,
) {
  const value = String(code ?? "").trim();
  if (!value) {
    throw new HttpError(400, `${label} không hợp lệ`);
  }
  const def = await prisma.dataDefinition.findFirst({
    where: { category, code: value, deletedAt: null },
    select: { id: true, isActive: true },
  });
  if (!def) {
    throw new HttpError(400, `${label} «${value}» chưa có trong danh mục thuộc tính (${category}).`);
  }
  if (!def.isActive) {
    throw new HttpError(400, `${label} «${value}» đã tắt — chọn giá trị khác.`);
  }
}
