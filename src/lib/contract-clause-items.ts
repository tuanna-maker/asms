export type ContractClauseEntry = {
  clauseId: string;
  content: string;
  title?: string;
};

export function normalizeClauseEntriesFromDetail(input: {
  clauseItems?: ContractClauseEntry[] | null;
  clauseIds?: string[] | null;
}): ContractClauseEntry[] {
  const fromItems = input.clauseItems ?? [];
  if (fromItems.length > 0) {
    return fromItems.map((item) => ({
      clauseId: item.clauseId,
      content: String(item.content ?? ""),
      ...(item.title ? { title: item.title } : {}),
    }));
  }
  const ids = input.clauseIds ?? [];
  const seen = new Set<string>();
  return ids
    .filter((id) => {
      const t = id.trim();
      if (!t || seen.has(t)) return false;
      seen.add(t);
      return true;
    })
    .map((clauseId) => ({ clauseId, content: "" }));
}
