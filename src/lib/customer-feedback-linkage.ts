import type { FeedbackLinkageItem, FeedbackLinkageInput } from "@/hooks/use-customer-feedbacks-api";

export function linkageItemsToSelection(items: FeedbackLinkageItem[]): {
  productIds: string[];
  materialIds: string[];
} {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const materialIds = items.map((i) => i.materialId).filter((id): id is string => Boolean(id));
  return { productIds, materialIds: [...new Set(materialIds)] };
}

type LinkageProductMeta = { id: string; contractIds?: string[] };
type LinkageMaterialMeta = { id: string; contractIds: string[]; productIds: string[] };

/** API mới: productIds[]; API cũ: productId đơn. */
export type LinkageMaterialInput = {
  id: string;
  contractIds?: string[];
  productIds?: string[];
  productId?: string;
};

export function normalizeLinkageMaterial(m: LinkageMaterialInput): LinkageMaterialMeta | null {
  if (!m?.id) return null;
  const legacy = m as LinkageMaterialInput & { contractId?: string };
  const contractIds =
    m.contractIds?.length
      ? [...m.contractIds]
      : legacy.contractId
        ? [legacy.contractId]
        : [];
  const productIds =
    m.productIds?.length
      ? [...m.productIds]
      : m.productId
        ? [m.productId]
        : [];
  return {
    id: m.id,
    contractIds,
    productIds,
  };
}

export function normalizeLinkageMaterials(
  list: LinkageMaterialInput[] | null | undefined,
): LinkageMaterialMeta[] {
  if (!list?.length) return [];
  const out: LinkageMaterialMeta[] = [];
  for (const item of list) {
    const n = normalizeLinkageMaterial(item);
    if (n) out.push(n);
  }
  return out;
}

/** Một ticket chỉ lưu một contractId. */
export function resolveFeedbackContractId(
  contractId: string | null,
  productIds: string[],
  materialIds: string[],
  products: LinkageProductMeta[],
  materials: LinkageMaterialInput[],
): string | null {
  if (contractId) return contractId;

  const normalizedMaterials = normalizeLinkageMaterials(materials);
  let candidates: Set<string> | null = null;
  const intersect = (ids: string[]) => {
    const set = new Set(ids);
    if (!candidates) {
      candidates = set;
      return;
    }
    candidates = new Set([...candidates].filter((id) => set.has(id)));
  };

  for (const pid of productIds) {
    const p = products.find((x) => x.id === pid);
    if (p?.contractIds?.length) intersect(p.contractIds);
  }
  for (const mid of materialIds) {
    const m = normalizedMaterials.find((x) => x.id === mid);
    if (m?.contractIds.length) intersect(m.contractIds);
  }

  if (!candidates || candidates.size !== 1) return null;
  return [...candidates][0]!;
}

export function resolveProductIdForMaterial(
  materialId: string,
  selectedProducts: string[],
  materialsMeta: LinkageMaterialInput[],
): string | null {
  const raw = materialsMeta.find((m) => m.id === materialId);
  if (!raw) return null;
  const meta = normalizeLinkageMaterial(raw);
  if (meta.productIds.length === 0) return null;

  const fromTicked = selectedProducts.filter((pid) => meta.productIds.includes(pid));
  if (fromTicked.length === 1) return fromTicked[0]!;
  if (fromTicked.length > 1) return fromTicked[0]!;

  if (meta.productIds.length === 1) return meta.productIds[0]!;
  return null;
}

export function buildLinkagePayload(
  selectedProducts: string[],
  selectedMaterials: string[],
  materialsMeta: LinkageMaterialInput[],
): FeedbackLinkageInput[] {
  const items: FeedbackLinkageInput[] = [];
  const materialsByProduct = new Map<string, string[]>();
  const productsInPayload = new Set<string>(selectedProducts);
  const normalized = normalizeLinkageMaterials(materialsMeta);

  for (const materialId of selectedMaterials) {
    const productId = resolveProductIdForMaterial(materialId, selectedProducts, normalized);
    if (!productId) continue;
    productsInPayload.add(productId);
    const list = materialsByProduct.get(productId) ?? [];
    list.push(materialId);
    materialsByProduct.set(productId, list);
  }

  for (const productId of productsInPayload) {
    const mats = materialsByProduct.get(productId) ?? [];
    if (mats.length === 0) {
      if (selectedProducts.includes(productId)) {
        items.push({ productId });
      }
    } else {
      for (const materialId of mats) {
        items.push({ productId, materialId });
      }
    }
  }
  return items;
}

export function formatLinkageSummary(
  items: FeedbackLinkageItem[],
  contract?: { code: string; title: string } | null,
): string {
  if (items.length === 0) return "—";
  const contractLabel = contract ? `${contract.code} — ${contract.title}` : "—";
  const lines = items.map((item) => {
    const sp = `${item.productCode} — ${item.productName}`;
    if (item.materialId && item.materialCode) {
      const vt = `${item.materialCode} — ${item.materialName ?? ""}`;
      return `${contractLabel} → ${sp} → ${vt}`;
    }
    return `${contractLabel} → ${sp}`;
  });
  return lines.join("\n");
}

export function formatLinkageSummaryShort(items: FeedbackLinkageItem[]): string {
  if (items.length === 0) return "—";
  const products = new Set(items.map((i) => i.productCode));
  const materials = items.filter((i) => i.materialId).map((i) => i.materialCode);
  const parts: string[] = [];
  if (products.size) parts.push(`${products.size} SP`);
  if (materials.length) parts.push(`${materials.length} VT`);
  return parts.join(", ") || "—";
}
