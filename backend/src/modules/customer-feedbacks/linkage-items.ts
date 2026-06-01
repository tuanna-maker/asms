import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { FeedbackLinkageInput, FeedbackLinkageItem } from "./linkage-types";

export function parseLinkageItemsJson(value: Prisma.JsonValue | null | undefined): FeedbackLinkageItem[] {
  if (!value || !Array.isArray(value)) return [];
  const out: FeedbackLinkageItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.productId !== "string" || typeof o.productCode !== "string" || typeof o.productName !== "string") {
      continue;
    }
    out.push({
      productId: o.productId,
      productCode: o.productCode,
      productName: o.productName,
      materialId: typeof o.materialId === "string" ? o.materialId : null,
      materialCode: typeof o.materialCode === "string" ? o.materialCode : null,
      materialName: typeof o.materialName === "string" ? o.materialName : null,
    });
  }
  return out;
}

export async function enrichAndValidateLinkageItems(
  customerId: string,
  contractId: string | null,
  inputs: FeedbackLinkageInput[],
): Promise<FeedbackLinkageItem[]> {
  if (inputs.length === 0) return [];
  if (!contractId) {
    throw new HttpError(400, "Vui lòng chọn hợp đồng khi gắn sản phẩm/vật tư");
  }

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, customerId, deletedAt: null },
    select: { id: true },
  });
  if (!contract) {
    throw new HttpError(400, "Hợp đồng không thuộc khách hàng này");
  }

  const productIds = [...new Set(inputs.map((i) => i.productId))];
  const cps = await prisma.contractProduct.findMany({
    where: {
      contractId,
      deletedAt: null,
      productId: { in: productIds },
      product: { deletedAt: null },
    },
    select: {
      productId: true,
      product: { select: { id: true, code: true, name: true } },
    },
  });
  const productMap = new Map(cps.map((cp) => [cp.productId, cp.product]));

  const materialIds = inputs.map((i) => i.materialId).filter((id): id is string => Boolean(id));
  const bomRows =
    materialIds.length > 0
      ? await prisma.productBom.findMany({
          where: {
            productId: { in: productIds },
            materialId: { in: materialIds },
            material: { deletedAt: null },
          },
          select: {
            productId: true,
            materialId: true,
            material: { select: { id: true, code: true, name: true } },
          },
        })
      : [];
  const bomKey = (productId: string, materialId: string) => `${productId}:${materialId}`;
  const bomMap = new Map(bomRows.map((b) => [bomKey(b.productId, b.materialId), b]));

  const result: FeedbackLinkageItem[] = [];
  for (const input of inputs) {
    const product = productMap.get(input.productId);
    if (!product) {
      throw new HttpError(400, "Sản phẩm không thuộc hợp đồng đã chọn");
    }
    if (input.materialId) {
      const bom = bomMap.get(bomKey(input.productId, input.materialId));
      if (!bom) {
        throw new HttpError(400, "Vật tư không thuộc sản phẩm đã chọn");
      }
      result.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        materialId: bom.material.id,
        materialCode: bom.material.code,
        materialName: bom.material.name,
      });
    } else {
      result.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        materialId: null,
        materialCode: null,
        materialName: null,
      });
    }
  }
  return result;
}
