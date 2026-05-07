import { prisma } from "../../utils/prisma";

export async function getContractProductCounts(contractIds: string[]) {
  const uniqueIds = [...new Set(contractIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, number>();

  const grouped = await prisma.contractProduct.groupBy({
    by: ["contractId"],
    where: {
      contractId: { in: uniqueIds },
      deletedAt: null,
    },
    _sum: {
      quantity: true,
    },
  });

  return new Map(
    grouped
      .filter((row): row is typeof row & { contractId: string } => typeof row.contractId === "string")
      .map((row) => [row.contractId, row._sum.quantity ?? 0]),
  );
}

export async function getContractProductCount(contractId: string) {
  const counts = await getContractProductCounts([contractId]);
  return counts.get(contractId) ?? 0;
}

export async function syncContractProductCounts(contractIds: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(contractIds.filter((id): id is string => typeof id === "string" && id.length > 0))];
  if (uniqueIds.length === 0) return;

  const counts = await getContractProductCounts(uniqueIds);

  await prisma.$transaction(
    uniqueIds.flatMap((contractId) => {
      const products = counts.get(contractId) ?? 0;
      return [
        prisma.contract.updateMany({
          where: { id: contractId, deletedAt: null },
          data: { products },
        }),
        prisma.handover.updateMany({
          where: { contractId, deletedAt: null },
          data: { products },
        }),
        prisma.trainingCourse.updateMany({
          where: { contractId, deletedAt: null },
          data: { participants: products },
        }),
      ];
    }),
  );
}
