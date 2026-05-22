import { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { ORDER_BY_CREATED_DESC } from "../../lib/list-order";
import { prisma } from "../../utils/prisma";
import { startInstanceForEntity } from "../workflows/runtime";
import { loadWorkflowSnapshotsByInstanceIds, type WorkflowSnapshot } from "../workflows/instance-snapshot";
import { syncContractProductCounts } from "../contracts/product-count";
import { resolveActiveDefinitionCode } from "../definitions/assert-active-code";
import { enrichProductWithStepPayloads, upsertStepPayloads, type ProductStepPayloadJson } from "./step-payload";

import { createProductSchema } from "./schema";
import type { z } from "zod";

type CreateProductInput = z.infer<typeof createProductSchema>;

const listSelect = {
  id: true,
  code: true,
  name: true,
  category: true,
  specs: true,
  status: true,
  version: true,
  description: true,
  manufacturer: true,
  unit: true,
  yearReleased: true,
  totalProduced: true,
  customerId: true,
  workflowInstanceId: true,
  createdAt: true,
  updatedAt: true,
  productBoms: {
    select: {
      materialId: true,
      quantity: true,
      serialNumbers: true,
      createdAt: true,
      updatedAt: true,
      material: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
          serial: true,
        },
      },
    },
    orderBy: ORDER_BY_CREATED_DESC,
  },
  contractProducts: {
    where: { deletedAt: null, contract: { deletedAt: null } },
    select: {
      quantity: true,
      contract: {
        select: {
          id: true,
          code: true,
          title: true,
          trainingCourses: {
            where: { deletedAt: null },
            select: {
              id: true,
              code: true,
              title: true,
              startDate: true,
              endDate: true,
              participants: true,
              status: true,
              location: true,
              instructor: { select: { fullName: true } },
            },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof listSelect }>;

function formatProductWithBom(row: ProductRow) {
  return {
    ...row,
    bom: row.productBoms.map((item) => ({
      materialDbId: item.materialId,
      materialId: item.material.code,
      materialName: item.material.name,
      quantity: item.quantity,
      unit: item.material.unit,
      serialNumbers:
        item.serialNumbers.length > 0
          ? item.serialNumbers
          : item.material.serial
            ? [item.material.serial]
            : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    contracts: row.contractProducts.map((link) => ({
      id: link.contract.id,
      code: link.contract.code,
      title: link.contract.title,
      quantity: link.quantity,
      trainings: link.contract.trainingCourses.map((course) => ({
        id: course.id,
        code: course.code,
        title: course.title,
        startDate: course.startDate,
        endDate: course.endDate,
        participants: course.participants,
        status: course.status,
        location: course.location,
        trainer: course.instructor?.fullName ?? "Chưa phân công",
      })),
    })),
  };
}

async function resolveCustomerIdOptional(idOrCode: string | undefined) {
  if (idOrCode == null || idOrCode === "") return null;
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

export async function listProductsService() {
  const rows = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: ORDER_BY_CREATED_DESC,
    select: listSelect,
  });
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds(
    rows.map((r) => r.workflowInstanceId),
  );
  return rows.map((row) => ({
    ...formatProductWithBom(row),
    workflow: row.workflowInstanceId
      ? (workflowMap.get(row.workflowInstanceId) ?? null)
      : null,
  }));
}

async function resolveProductId(idOrCode: string) {
  const row = await prisma.product.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Product not found");
  return row.id;
}

async function resolveMaterialId(idOrCode: string) {
  const row = await prisma.material.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Material not found");
  return row.id;
}

export async function getProductDetailService(idOrCode: string) {
  const id = await resolveProductId(idOrCode);
  const row = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: listSelect,
  });
  if (!row) throw new HttpError(404, "Product not found");
  const formatted = formatProductWithBom(row);
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds([row.workflowInstanceId]);
  const workflow: WorkflowSnapshot | null = row.workflowInstanceId
    ? (workflowMap.get(row.workflowInstanceId) ?? null)
    : null;
  const enriched = await enrichProductWithStepPayloads(formatted);
  return { ...enriched, workflow };
}

export async function updateProductService(idOrCode: string, payload: Record<string, unknown>) {
  const id = await resolveProductId(idOrCode);
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Product not found");

  const data: Record<string, unknown> = {};
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.category !== undefined) {
    data.category = await resolveActiveDefinitionCode(
      "product_category",
      String(payload.category),
      "Nhóm sản phẩm",
    );
  }
  if (payload.specs !== undefined) data.specs = payload.specs;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.version !== undefined) data.version = payload.version;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.manufacturer !== undefined) data.manufacturer = payload.manufacturer;
  if (payload.unit !== undefined) data.unit = payload.unit;
  if (payload.yearReleased !== undefined) data.yearReleased = payload.yearReleased;
  if (payload.totalProduced !== undefined) data.totalProduced = payload.totalProduced;

  if (payload.customerId !== undefined) {
    const v = payload.customerId;
    data.customerId =
      v === null || v === "" ? null : await resolveCustomerIdOptional(String(v));
  }

  if (payload.code !== undefined) {
    const dup = await prisma.product.findFirst({
      where: { code: String(payload.code), deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new HttpError(409, "Product code already exists");
  }

  if (
    Object.keys(data).length === 0 &&
    !(payload.stepPayloads && Object.keys(payload.stepPayloads as Record<string, unknown>).length > 0)
  ) {
    throw new HttpError(400, "No fields to update");
  }

  try {
    const updated = Object.keys(data).length > 0
      ? await prisma.product.update({
          where: { id },
          data: data as Prisma.ProductUpdateInput,
          select: listSelect,
        })
      : await prisma.product.findFirstOrThrow({ where: { id }, select: listSelect });

    if (payload.stepPayloads && Object.keys(payload.stepPayloads as Record<string, unknown>).length > 0) {
      await upsertStepPayloads(id, payload.stepPayloads as Record<string, ProductStepPayloadJson>);
    }

    return getProductDetailService(id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Product code already exists");
    }
    throw e;
  }
}

export async function softDeleteProductService(idOrCode: string) {
  const id = await resolveProductId(idOrCode);
  const now = new Date();
  const affectedLinks = await prisma.contractProduct.findMany({
    where: { productId: id, deletedAt: null },
    select: { contractId: true },
  });
  await prisma.$transaction([
    prisma.product.update({ where: { id }, data: { deletedAt: now } }),
    prisma.contractProduct.updateMany({
      where: { productId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
  ]);
  await syncContractProductCounts(affectedLinks.map((item) => item.contractId));
  return { id };
}

export async function upsertProductBomService(
  idOrCode: string,
  payload: { materialId: string; quantity: number; serialNumbers?: string[] | undefined },
) {
  const productId = await resolveProductId(idOrCode);
  const materialId = await resolveMaterialId(payload.materialId);
  const row = await prisma.productBom.upsert({
    where: { productId_materialId: { productId, materialId } },
    update: {
      quantity: payload.quantity,
      serialNumbers: payload.serialNumbers ?? [],
    },
    create: {
      productId,
      materialId,
      quantity: payload.quantity,
      serialNumbers: payload.serialNumbers ?? [],
    },
    select: {
      materialId: true,
      quantity: true,
      serialNumbers: true,
      createdAt: true,
      updatedAt: true,
      material: { select: { code: true, name: true, unit: true, serial: true } },
    },
  });
  return {
    materialId: row.material.code,
    materialName: row.material.name,
    quantity: row.quantity,
    unit: row.material.unit,
    serialNumbers:
      row.serialNumbers.length > 0
        ? row.serialNumbers
        : row.material.serial
          ? [row.material.serial]
          : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function updateProductBomService(
  idOrCode: string,
  materialIdOrCode: string,
  payload: { quantity?: number | undefined; serialNumbers?: string[] | undefined },
) {
  const productId = await resolveProductId(idOrCode);
  const materialId = await resolveMaterialId(materialIdOrCode);
  const existing = await prisma.productBom.findUnique({
    where: { productId_materialId: { productId, materialId } },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Product BOM item not found");
  const row = await prisma.productBom.update({
    where: { productId_materialId: { productId, materialId } },
    data: {
      ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
      ...(payload.serialNumbers !== undefined ? { serialNumbers: payload.serialNumbers } : {}),
    },
    select: {
      materialId: true,
      quantity: true,
      serialNumbers: true,
      createdAt: true,
      updatedAt: true,
      material: { select: { code: true, name: true, unit: true, serial: true } },
    },
  });
  return {
    materialId: row.material.code,
    materialName: row.material.name,
    quantity: row.quantity,
    unit: row.material.unit,
    serialNumbers:
      row.serialNumbers.length > 0
        ? row.serialNumbers
        : row.material.serial
          ? [row.material.serial]
          : [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function removeProductBomService(idOrCode: string, materialIdOrCode: string) {
  const productId = await resolveProductId(idOrCode);
  const materialId = await resolveMaterialId(materialIdOrCode);
  const existing = await prisma.productBom.findUnique({
    where: { productId_materialId: { productId, materialId } },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Product BOM item not found");
  await prisma.productBom.delete({
    where: { productId_materialId: { productId, materialId } },
  });
  return { productId, materialId };
}

export async function createProductService(payload: CreateProductInput) {
  const dup = await prisma.product.findFirst({
    where: { code: payload.code, deletedAt: null },
    select: { id: true },
  });
  if (dup) throw new HttpError(409, "Product code already exists");

  const categoryCode = await resolveActiveDefinitionCode(
    "product_category",
    payload.category,
    "Nhóm sản phẩm",
  );

  const customerId = await resolveCustomerIdOptional(payload.customerId);

  try {
    const created = await prisma.product.create({
      data: {
        code: payload.code,
        name: payload.name,
        category: categoryCode,
        specs: (payload.specs ?? []) as unknown as Prisma.InputJsonValue,
        status: payload.status ?? "producing",
        version: payload.version ?? null,
        description: payload.description ?? null,
        manufacturer: payload.manufacturer ?? null,
        unit: payload.unit ?? null,
        yearReleased: payload.yearReleased ?? null,
        totalProduced: payload.totalProduced ?? 0,
        customerId,
      },
      select: listSelect,
    });

    try {
      await startInstanceForEntity("product", created.id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[product] workflow init failed", e);
    }

    return getProductDetailService(created.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Product code already exists");
    }
    throw e;
  }
}
