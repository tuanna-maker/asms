import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  useFeedbackLinkageOptions,
  type LinkageOptionMaterial,
} from "@/hooks/use-feedback-linkage-options";
import type { FeedbackLinkageItem } from "@/hooks/use-customer-feedbacks-api";
import {
  buildLinkagePayload,
  formatLinkageSummary,
  linkageItemsToSelection,
  normalizeLinkageMaterials,
  resolveFeedbackContractId,
} from "@/lib/customer-feedback-linkage";

export type FeedbackLinkageSelection = {
  contractId: string | null;
  productIds: string[];
  materialIds: string[];
};

type Props = {
  customerId: string | null;
  contractId: string | null;
  productIds: string[];
  materialIds: string[];
  onChange: (next: FeedbackLinkageSelection) => void;
  fixedContractId?: string | null;
  initialLinkageItems?: FeedbackLinkageItem[];
  disabled?: boolean;
  columnMaxHeight?: string;
  /** Sửa phản ánh: tải đủ HĐ/SP/VT ngay; wizard: lọc theo lựa chọn */
  catalogScope?: "full" | "filtered";
};

export function FeedbackLinkagePicker({
  customerId,
  contractId,
  productIds,
  materialIds,
  onChange,
  fixedContractId,
  initialLinkageItems,
  disabled = false,
  columnMaxHeight = "min(52vh, 520px)",
  catalogScope = "filtered",
}: Props) {
  const hydratedRef = useRef(false);
  const effectiveContractId = fixedContractId ?? contractId;

  const { data, isLoading, isFetching } = useFeedbackLinkageOptions(
    customerId,
    { contractId: effectiveContractId, productIds, materialIds },
    Boolean(customerId),
    { scope: catalogScope },
  );

  const allContracts = data?.contracts ?? [];
  const allProducts = data?.products ?? [];
  const allMaterials = useMemo(
    () => mergeMaterialsById(data?.materials ?? []),
    [data?.materials],
  );

  const contracts = allContracts;

  const products = useMemo(() => {
    if (catalogScope === "filtered" && !effectiveContractId) return [];
    let list = allProducts;
    if (effectiveContractId) {
      list = list.filter((p) => p.contractIds.includes(effectiveContractId));
    }
    if (materialIds.length > 0) {
      const productIdsFromMaterials = new Set(
        allMaterials
          .filter((m) => materialIds.includes(m.id))
          .flatMap((m) => m.productIds ?? []),
      );
      if (productIdsFromMaterials.size > 0) {
        list = list.filter((p) => productIdsFromMaterials.has(p.id));
      }
    }
    return list;
  }, [catalogScope, effectiveContractId, allProducts, allMaterials, materialIds]);

  const materials = useMemo(() => {
    if (catalogScope === "filtered" && !effectiveContractId) return [];
    let list = allMaterials;
    if (effectiveContractId) {
      list = list.filter((m) => m.contractIds.includes(effectiveContractId));
    }
    if (productIds.length > 0) {
      list = list.filter((m) => m.productIds.some((pid) => productIds.includes(pid)));
    }
    return list;
  }, [catalogScope, effectiveContractId, allMaterials, productIds]);

  useEffect(() => {
    if (!initialLinkageItems?.length || hydratedRef.current) return;
    hydratedRef.current = true;
    const sel = linkageItemsToSelection(initialLinkageItems);
    onChange({
      contractId: fixedContractId ?? contractId,
      productIds: sel.productIds,
      materialIds: sel.materialIds,
    });
  }, [initialLinkageItems, fixedContractId, contractId, onChange]);

  useEffect(() => {
    if (fixedContractId && contractId !== fixedContractId) {
      onChange({ contractId: fixedContractId, productIds, materialIds });
    }
  }, [fixedContractId, contractId, productIds, materialIds, onChange]);

  const normalizedMaterials = useMemo(
    () => normalizeLinkageMaterials(allMaterials),
    [allMaterials],
  );

  const resolvedContractId = useMemo(
    () =>
      resolveFeedbackContractId(
        effectiveContractId,
        productIds,
        materialIds,
        allProducts,
        normalizedMaterials,
      ),
    [effectiveContractId, productIds, materialIds, allProducts, normalizedMaterials],
  );

  const contractForSummary = useMemo(() => {
    if (!resolvedContractId) return null;
    return contracts.find((c) => c.id === resolvedContractId) ?? null;
  }, [resolvedContractId, contracts]);

  const summaryItems = useMemo(() => {
    if (!resolvedContractId) return [];
    const payload = buildLinkagePayload(productIds, materialIds, normalizedMaterials);
    if (payload.length === 0) return [];
    return payload.map((line) => {
      const product = allProducts.find((p) => p.id === line.productId);
      const material = line.materialId ? allMaterials.find((m) => m.id === line.materialId) : null;
      return {
        productId: line.productId,
        productCode: product?.code ?? line.productId,
        productName: product?.name ?? "",
        materialId: material?.id ?? null,
        materialCode: material?.code ?? null,
        materialName: material?.name ?? null,
      };
    });
  }, [resolvedContractId, productIds, materialIds, normalizedMaterials, allProducts, allMaterials]);

  /** Một HĐ; bấm lại để bỏ chọn. Đổi HĐ thì giữ SP/VT vẫn thuộc HĐ mới. */
  const toggleContract = (id: string) => {
    const nextContractId = effectiveContractId === id ? null : id;
    if (!nextContractId) {
      onChange({ contractId: null, productIds: [], materialIds: [] });
      return;
    }
    const validProductIds = productIds.filter((pid) =>
      allProducts.some((p) => p.id === pid && p.contractIds.includes(nextContractId)),
    );
    const validMaterialIds = materialIds.filter((mid) =>
      allMaterials.some((m) => m.id === mid && m.contractIds.includes(nextContractId)),
    );
    onChange({
      contractId: nextContractId,
      productIds: validProductIds,
      materialIds: validMaterialIds,
    });
  };

  const toggleProduct = (productId: string) => {
    const has = productIds.includes(productId);
    onChange({
      contractId: effectiveContractId,
      productIds: has ? productIds.filter((pid) => pid !== productId) : [...productIds, productId],
      materialIds,
    });
  };

  /** Chỉ tick VT; lọc danh sách SP — không tick HĐ/SP. */
  const toggleMaterial = (materialId: string) => {
    const has = materialIds.includes(materialId);
    onChange({
      contractId: effectiveContractId,
      productIds,
      materialIds: has ? materialIds.filter((id) => id !== materialId) : [...materialIds, materialId],
    });
  };

  if (!customerId) {
    return (
      <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
        Chọn khách hàng trước để liên kết hợp đồng, sản phẩm và vật tư.
      </p>
    );
  }

  return (
    <div className="space-y-3 flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between gap-2 shrink-0">
        <Label className="text-sm font-medium">Liên kết HĐ — Sản phẩm — Vật tư</Label>
        {(isLoading || isFetching) && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-[280px]">
        <LinkageColumn title="Hợp đồng" maxHeight={columnMaxHeight}>
          {fixedContractId ? (
            <p className="text-xs text-muted-foreground px-2 py-1">
              HĐ cố định theo ngữ cảnh màn hình.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-1">
              Tối đa một HĐ; bấm lại để bỏ chọn. Cột SP/VT chỉ hiển thị trong phạm vi HĐ đã chọn.
            </p>
          )}
          {contracts.length === 0 ? (
            <EmptyColumn />
          ) : (
            contracts.map((c) => (
              <label
                key={c.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-secondary/40 ${
                  effectiveContractId === c.id ? "bg-primary/10" : ""
                } ${fixedContractId ? "pointer-events-none opacity-80" : ""}`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={effectiveContractId === c.id}
                  disabled={disabled || Boolean(fixedContractId)}
                  onChange={() => toggleContract(c.id)}
                />
                <span className="text-sm min-w-0">
                  <span className="font-mono text-xs text-muted-foreground block">{c.code}</span>
                  <span className="line-clamp-2">{c.title}</span>
                </span>
              </label>
            ))
          )}
        </LinkageColumn>

        <LinkageColumn title="Sản phẩm" maxHeight={columnMaxHeight}>
          {products.length === 0 ? (
            <EmptyColumn
              hint={
                !effectiveContractId
                  ? "Chọn hợp đồng trước"
                  : materialIds.length > 0
                    ? "Không có SP chứa VT đã chọn"
                    : "Hợp đồng này chưa có sản phẩm"
              }
            />
          ) : (
            products.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-secondary/40 ${
                  productIds.includes(p.id) ? "bg-primary/10" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={productIds.includes(p.id)}
                  disabled={disabled}
                  onChange={() => toggleProduct(p.id)}
                />
                <span className="text-sm min-w-0">
                  <span className="font-mono text-xs text-muted-foreground block">{p.code}</span>
                  <span className="line-clamp-2">{p.name}</span>
                  {p.contractIds.length > 0 ? (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      HĐ:{" "}
                      {p.contractIds
                        .map((cid) => contracts.find((c) => c.id === cid)?.code ?? cid)
                        .join(", ")}
                    </span>
                  ) : null}
                </span>
              </label>
            ))
          )}
        </LinkageColumn>

        <LinkageColumn title="Vật tư" maxHeight={columnMaxHeight}>
          {materials.length === 0 ? (
            <EmptyColumn
              hint={
                !effectiveContractId
                  ? "Chọn hợp đồng trước"
                  : productIds.length === 0
                    ? "Chọn sản phẩm hoặc xem toàn bộ VT trong HĐ"
                    : "Sản phẩm đã chọn không có vật tư trên BOM"
              }
            />
          ) : (
            materials.map((m) => (
              <label
                key={m.id}
                className={`flex items-start gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-secondary/40 ${
                  materialIds.includes(m.id) ? "bg-primary/10" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={materialIds.includes(m.id)}
                  disabled={disabled}
                  onChange={() => toggleMaterial(m.id)}
                />
                <span className="text-sm min-w-0">
                  <span className="font-mono text-xs text-muted-foreground block">{m.code}</span>
                  <span className="line-clamp-2">{m.name}</span>
                </span>
              </label>
            ))
          )}
        </LinkageColumn>
      </div>

      {summaryItems.length > 0 && contractForSummary ? (
        <div className="rounded-lg bg-secondary/30 border border-border/50 p-3 text-xs whitespace-pre-wrap text-muted-foreground shrink-0">
          <p className="font-medium text-card-foreground mb-1">Tóm tắt lựa chọn</p>
          {formatLinkageSummary(summaryItems, contractForSummary)}
        </div>
      ) : null}
    </div>
  );
}

function LinkageColumn({
  title,
  children,
  maxHeight,
}: {
  title: string;
  children: ReactNode;
  maxHeight: string;
}) {
  return (
    <div className="flex flex-col border border-border/50 rounded-lg overflow-hidden min-h-[240px] h-full">
      <div className="px-2 py-1.5 bg-secondary/50 border-b border-border/50 text-xs font-semibold shrink-0">
        {title}
      </div>
      <div className="flex-1 overflow-y-auto p-1 space-y-0.5" style={{ maxHeight }}>
        {children}
      </div>
    </div>
  );
}

function EmptyColumn({ hint = "Không có dữ liệu" }: { hint?: string }) {
  return <p className="text-xs text-muted-foreground text-center py-6 px-2">{hint}</p>;
}

/** Gộp VT trùng id (API cũ hoặc nhiều SP cùng BOM). */
function mergeMaterialsById(list: LinkageOptionMaterial[]): LinkageOptionMaterial[] {
  const map = new Map<string, LinkageOptionMaterial>();
  for (const m of list) {
    const legacy = m as LinkageOptionMaterial & { productId?: string };
    const incomingProductIds =
      m.productIds && m.productIds.length > 0
        ? m.productIds
        : legacy.productId
          ? [legacy.productId]
          : [];
    const cur = map.get(m.id);
    if (!cur) {
      map.set(m.id, {
        id: m.id,
        code: m.code,
        name: m.name,
        productIds: [...incomingProductIds],
        contractIds: [...(m.contractIds ?? [])],
      });
      continue;
    }
    for (const pid of incomingProductIds) {
      if (!cur.productIds.includes(pid)) cur.productIds.push(pid);
    }
    for (const cid of m.contractIds ?? []) {
      if (!cur.contractIds.includes(cid)) cur.contractIds.push(cid);
    }
  }
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}
