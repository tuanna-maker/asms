import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

export type ContractClauseItemInput = {
  clauseId: string;
  content: string;
};

export type ContractClauseItemRecord = ContractClauseItemInput & {
  title?: string;
};

/** Ghép các khối điều khoản thành chuỗi `terms` (snapshot). */
export function joinClauseBlocks(blocks: string[]): string | null {
  const parts = blocks.map((b) => b.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join("\n\n");
}

export function formatClauseBlock(title: string, content: string): string {
  const t = title.trim();
  const c = content.trim();
  if (!t && !c) return "";
  if (!c) return t;
  if (!t) return c;
  return `${t}\n${c}`;
}

/** Giữ thứ tự, bỏ trùng `clauseId` (giữ lần đầu). */
export function dedupeClauseItems(items: ContractClauseItemInput[]): ContractClauseItemInput[] {
  const seen = new Set<string>();
  const unique: ContractClauseItemInput[] = [];
  for (const item of items) {
    const clauseId = item.clauseId?.trim();
    if (!clauseId || seen.has(clauseId)) continue;
    seen.add(clauseId);
    unique.push({ clauseId, content: String(item.content ?? "") });
  }
  return unique;
}

function dedupePreserveOrderIds(clauseIds: string[]): string[] {
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
 * Ghép `terms` từ tiêu đề mẫu (DB) + nội dung nhập trên hợp đồng (payload).
 */
export async function buildTermsFromClauseItems(
  items: ContractClauseItemInput[],
): Promise<{
  orderedIds: string[];
  clauseItems: ContractClauseItemInput[];
  terms: string | null;
}> {
  const unique = dedupeClauseItems(items);
  if (unique.length === 0) {
    return { orderedIds: [], clauseItems: [], terms: null };
  }

  const ids = unique.map((i) => i.clauseId);
  await assertActiveClauseIds(ids);

  const clauses = await prisma.contractClause.findMany({
    where: { id: { in: ids }, deletedAt: null, isActive: true },
    select: { id: true, title: true },
  });
  const titleMap = new Map(clauses.map((c) => [c.id, c.title]));

  const orderedItems = unique.filter((i) => titleMap.has(i.clauseId));
  const blocks = orderedItems.map((i) =>
    formatClauseBlock(titleMap.get(i.clauseId) ?? "", i.content),
  );

  return {
    orderedIds: orderedItems.map((i) => i.clauseId),
    clauseItems: orderedItems,
    terms: joinClauseBlocks(blocks),
  };
}

/** @deprecated Chỉ dùng khi client gửi `clauseIds` không kèm nội dung — tạo entries rỗng. */
export async function buildTermsFromClauseIds(clauseIds: string[]): Promise<{
  orderedIds: string[];
  terms: string | null;
}> {
  const unique = dedupePreserveOrderIds(clauseIds);
  const built = await buildTermsFromClauseItems(
    unique.map((clauseId) => ({ clauseId, content: "" })),
  );
  return { orderedIds: built.orderedIds, terms: built.terms };
}

export async function assertActiveClauseIds(clauseIds: string[]): Promise<void> {
  const unique = dedupePreserveOrderIds(clauseIds);
  if (unique.length === 0) return;

  const found = await prisma.contractClause.findMany({
    where: { id: { in: unique }, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (found.length !== unique.length) {
    throw new HttpError(400, "Một hoặc nhiều điều khoản không hợp lệ hoặc đã ngừng sử dụng");
  }
}

export function parseClauseItemsJson(value: Prisma.JsonValue | null | undefined): ContractClauseItemInput[] {
  if (!value || !Array.isArray(value)) return [];
  const result: ContractClauseItemInput[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const clauseId = String((raw as { clauseId?: unknown }).clauseId ?? "").trim();
    if (!clauseId) continue;
    const content = String((raw as { content?: unknown }).content ?? "");
    result.push({ clauseId, content });
  }
  return result;
}

/** Chuẩn hóa khi đọc HĐ: ưu tiên `clauseItems`, fallback `clauseIds` với content rỗng. */
export function normalizeStoredClauseItems(input: {
  clauseItems: Prisma.JsonValue | null | undefined;
  clauseIds: string[];
}): ContractClauseItemInput[] {
  const fromJson = parseClauseItemsJson(input.clauseItems);
  if (fromJson.length > 0) return fromJson;
  return dedupePreserveOrderIds(input.clauseIds).map((clauseId) => ({
    clauseId,
    content: "",
  }));
}

export async function enrichClauseItemsWithTitles(
  items: ContractClauseItemInput[],
): Promise<ContractClauseItemRecord[]> {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.clauseId);
  const clauses = await prisma.contractClause.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, title: true },
  });
  const titleMap = new Map(clauses.map((c) => [c.id, c.title]));
  return items.map((i) => ({
    ...i,
    title: titleMap.get(i.clauseId) ?? i.clauseId,
  }));
}
