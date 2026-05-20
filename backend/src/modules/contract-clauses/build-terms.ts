import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

/** Ghép nội dung điều khoản theo thứ tự catalog: nhóm → thành viên → mục lẻ. */
export function joinClauseContents(contents: string[]): string | null {
  const parts = contents.map((c) => c.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

/**
 * Sắp xếp `clauseIds` theo thứ tự hiển thị catalog rồi ghép `content` thành `terms`.
 */
export async function buildTermsFromClauseIds(clauseIds: string[]): Promise<{
  orderedIds: string[];
  terms: string | null;
}> {
  const unique = [...new Set(clauseIds.filter(Boolean))];
  if (unique.length === 0) {
    return { orderedIds: [], terms: null };
  }

  const idSet = new Set(unique);
  const [groups, clauses] = await Promise.all([
    prisma.contractClauseGroup.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      include: {
        members: {
          orderBy: { sortOrder: "asc" },
          include: {
            clause: {
              select: { id: true, content: true, deletedAt: true, isActive: true },
            },
          },
        },
      },
    }),
    prisma.contractClause.findMany({
      where: { id: { in: unique }, deletedAt: null, isActive: true },
      select: { id: true, content: true, sortOrder: true },
    }),
  ]);

  const clauseMap = new Map(clauses.map((c) => [c.id, c]));
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  const pushId = (id: string) => {
    if (!idSet.has(id) || seen.has(id) || !clauseMap.has(id)) return;
    seen.add(id);
    orderedIds.push(id);
  };

  for (const group of groups) {
    for (const member of group.members) {
      const clause = member.clause;
      if (!clause || clause.deletedAt || !clause.isActive) continue;
      pushId(clause.id);
    }
  }

  const orphans = clauses
    .filter((c) => !seen.has(c.id))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  for (const c of orphans) {
    pushId(c.id);
  }

  const contents = orderedIds.map((id) => clauseMap.get(id)?.content ?? "").filter(Boolean);
  return {
    orderedIds,
    terms: joinClauseContents(contents),
  };
}

export async function assertActiveClauseIds(clauseIds: string[]): Promise<void> {
  const unique = [...new Set(clauseIds.filter(Boolean))];
  if (unique.length === 0) return;

  const found = await prisma.contractClause.findMany({
    where: { id: { in: unique }, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new HttpError(400, "Một hoặc nhiều điều khoản không hợp lệ hoặc đã ngừng sử dụng");
  }
}
