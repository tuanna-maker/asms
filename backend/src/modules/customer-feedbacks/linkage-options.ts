import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type {
  LinkageOptionContract,
  LinkageOptionMaterial,
  LinkageOptionProduct,
  LinkageOptionsResponse,
} from "./linkage-types";

type GraphRow = {
  contractId: string;
  contractCode: string;
  contractTitle: string;
  productId: string;
  productCode: string;
  productName: string;
  materialId: string;
  materialCode: string;
  materialName: string;
};

async function loadGraphRows(customerId: string): Promise<GraphRow[]> {
  const contracts = await prisma.contract.findMany({
    where: { customerId, deletedAt: null },
    select: { id: true, code: true, title: true },
  });
  if (contracts.length === 0) return [];

  const contractIds = contracts.map((c) => c.id);
  const contractMap = new Map(contracts.map((c) => [c.id, c]));

  const cps = await prisma.contractProduct.findMany({
    where: {
      contractId: { in: contractIds },
      deletedAt: null,
      product: { deletedAt: null },
    },
    select: {
      contractId: true,
      product: { select: { id: true, code: true, name: true } },
    },
  });
  if (cps.length === 0) return [];

  const productIds = [...new Set(cps.map((cp) => cp.product.id))];
  const boms = await prisma.productBom.findMany({
    where: { productId: { in: productIds }, material: { deletedAt: null } },
    select: {
      productId: true,
      material: { select: { id: true, code: true, name: true } },
    },
  });
  const bomByProduct = new Map<string, typeof boms>();
  for (const b of boms) {
    const list = bomByProduct.get(b.productId) ?? [];
    list.push(b);
    bomByProduct.set(b.productId, list);
  }

  const rows: GraphRow[] = [];
  for (const cp of cps) {
    const contract = contractMap.get(cp.contractId);
    if (!contract) continue;
    const productBoms = bomByProduct.get(cp.product.id) ?? [];
    if (productBoms.length === 0) {
      rows.push({
        contractId: contract.id,
        contractCode: contract.code,
        contractTitle: contract.title,
        productId: cp.product.id,
        productCode: cp.product.code,
        productName: cp.product.name,
        materialId: "",
        materialCode: "",
        materialName: "",
      });
      continue;
    }
    for (const bom of productBoms) {
      rows.push({
        contractId: contract.id,
        contractCode: contract.code,
        contractTitle: contract.title,
        productId: cp.product.id,
        productCode: cp.product.code,
        productName: cp.product.name,
        materialId: bom.material.id,
        materialCode: bom.material.code,
        materialName: bom.material.name,
      });
    }
  }
  return rows;
}

function buildOptionsFromRows(rows: GraphRow[]): {
  contracts: LinkageOptionContract[];
  products: LinkageOptionProduct[];
  materials: LinkageOptionMaterial[];
} {
  const contractMap = new Map<string, LinkageOptionContract>();
  const productMap = new Map<string, LinkageOptionProduct>();
  const materialMap = new Map<string, LinkageOptionMaterial>();

  for (const row of rows) {
    contractMap.set(row.contractId, {
      id: row.contractId,
      code: row.contractCode,
      title: row.contractTitle,
    });
    const existingProduct = productMap.get(row.productId);
    if (existingProduct) {
      if (!existingProduct.contractIds.includes(row.contractId)) {
        existingProduct.contractIds.push(row.contractId);
      }
    } else {
      productMap.set(row.productId, {
        id: row.productId,
        code: row.productCode,
        name: row.productName,
        contractIds: [row.contractId],
      });
    }
    if (row.materialId) {
      const existingMaterial = materialMap.get(row.materialId);
      if (existingMaterial) {
        if (!existingMaterial.contractIds.includes(row.contractId)) {
          existingMaterial.contractIds.push(row.contractId);
        }
        if (!existingMaterial.productIds.includes(row.productId)) {
          existingMaterial.productIds.push(row.productId);
        }
      } else {
        materialMap.set(row.materialId, {
          id: row.materialId,
          code: row.materialCode,
          name: row.materialName,
          productIds: [row.productId],
          contractIds: [row.contractId],
        });
      }
    }
  }

  return {
    contracts: [...contractMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    products: [...productMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
    materials: [...materialMap.values()].sort((a, b) => a.code.localeCompare(b.code)),
  };
}

function filterRows(
  rows: GraphRow[],
  filters: { contractIds?: string[]; productIds?: string[]; materialIds?: string[] },
): GraphRow[] {
  let filtered = rows;
  if (filters.contractIds && filters.contractIds.length > 0) {
    const set = new Set(filters.contractIds);
    filtered = filtered.filter((r) => set.has(r.contractId));
  }
  if (filters.productIds && filters.productIds.length > 0) {
    const set = new Set(filters.productIds);
    filtered = filtered.filter((r) => set.has(r.productId));
  }
  if (filters.materialIds && filters.materialIds.length > 0) {
    const set = new Set(filters.materialIds);
    filtered = filtered.filter((r) => r.materialId && set.has(r.materialId));
  }
  return filtered;
}

export async function getFeedbackLinkageOptionsService(input: {
  customerId: string;
  contractIds?: string[];
  productIds?: string[];
  materialIds?: string[];
}): Promise<LinkageOptionsResponse> {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: input.customerId }, { code: input.customerId }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Không tìm thấy khách hàng");

  const allRows = await loadGraphRows(customer.id);
  if (allRows.length === 0) {
    return { contracts: [], products: [], materials: [] };
  }

  const contractFilter = input.contractIds?.length ? input.contractIds : undefined;
  const productFilter = input.productIds?.length ? input.productIds : undefined;
  const materialFilter = input.materialIds?.length ? input.materialIds : undefined;

  const contractRows = filterRows(allRows, {
    ...(productFilter ? { productIds: productFilter } : {}),
    ...(materialFilter ? { materialIds: materialFilter } : {}),
  });
  const productRows = filterRows(allRows, {
    ...(contractFilter ? { contractIds: contractFilter } : {}),
    ...(materialFilter ? { materialIds: materialFilter } : {}),
  });
  const materialRows = filterRows(allRows, {
    ...(contractFilter ? { contractIds: contractFilter } : {}),
    ...(productFilter ? { productIds: productFilter } : {}),
  });

  const contracts = buildOptionsFromRows(contractRows).contracts;
  const products = buildOptionsFromRows(productRows).products;
  const materials = buildOptionsFromRows(materialRows).materials;

  return { contracts, products, materials };
}
