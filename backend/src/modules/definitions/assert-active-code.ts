import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export async function assertActiveDefinitionCode(
  category: string,
  code: string,
  label: string,
) {
  await resolveActiveDefinitionCode(category, code, label);
}

/**
 * Chuẩn hóa giá trị danh mục: chấp nhận mã (code) hoặc nhãn hiển thị (label) cũ trong DB.
 * Trả về mã chuẩn để lưu.
 */
export async function resolveActiveDefinitionCode(
  category: string,
  codeOrLabel: string,
  label: string,
): Promise<string> {
  const value = String(codeOrLabel ?? "").trim();
  if (!value) {
    throw new HttpError(400, `${label} không hợp lệ`);
  }

  const byCode = await prisma.dataDefinition.findFirst({
    where: { category, code: value, deletedAt: null },
    select: { code: true, isActive: true },
  });
  if (byCode) {
    if (!byCode.isActive) {
      throw new HttpError(400, `${label} «${value}» đã tắt — chọn giá trị khác.`);
    }
    return byCode.code;
  }

  const byLabel = await prisma.dataDefinition.findFirst({
    where: { category, label: value, deletedAt: null },
    select: { code: true, isActive: true },
  });
  if (byLabel) {
    if (!byLabel.isActive) {
      throw new HttpError(400, `${label} «${value}» đã tắt — chọn giá trị khác.`);
    }
    return byLabel.code;
  }

  throw new HttpError(
    400,
    `${label} «${value}» chưa có trong danh mục thuộc tính (${category}). Chọn lại tại Cài đặt → Thuộc tính.`,
  );
}
