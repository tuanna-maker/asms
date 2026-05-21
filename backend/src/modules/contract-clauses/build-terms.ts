import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

/** Ghép nội dung điều khoản theo thứ tự đã chọn trên hợp đồng. */
export function joinClauseContents(contents: string[]): string | null {
  const parts = contents.map((c) => c.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

/** Giữ thứ tự `clauseIds` do người dùng sắp xếp trên form hợp đồng. */
function dedupePreserveOrder(clauseIds: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of clauseIds) {
    const trimmed = id?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}

/**
 * Ghép `content` thành `terms` theo đúng thứ tự mảng `clauseIds` gửi từ client.
 */
export async function buildTermsFromClauseIds(clauseIds: string[]): Promise<{
  orderedIds: string[];
  terms: string | null;
}> {
  const unique = dedupePreserveOrder(clauseIds);
  if (unique.length === 0) {
    return { orderedIds: [], terms: null };
  }

  const clauses = await prisma.contractClause.findMany({
    where: { id: { in: unique }, deletedAt: null, isActive: true },
    select: { id: true, content: true },
  });

  const clauseMap = new Map(clauses.map((c) => [c.id, c]));
  const orderedIds = unique.filter((id) => clauseMap.has(id));
  const contents = orderedIds.map((id) => clauseMap.get(id)?.content ?? "").filter(Boolean);

  return {
    orderedIds,
    terms: joinClauseContents(contents),
  };
}

export async function assertActiveClauseIds(clauseIds: string[]): Promise<void> {
  const unique = dedupePreserveOrder(clauseIds);
  if (unique.length === 0) return;

  const found = await prisma.contractClause.findMany({
    where: { id: { in: unique }, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new HttpError(400, "Một hoặc nhiều điều khoản không hợp lệ hoặc đã ngừng sử dụng");
  }
}
