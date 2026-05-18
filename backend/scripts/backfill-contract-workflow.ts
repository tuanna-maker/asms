/**
 * Backfill `Contract.workflowId` cho các hợp đồng cũ chưa có quy trình.
 * Gán workflow `moduleKey=contract` active (ưu tiên system) nếu có.
 *
 * Usage: cd backend && pnpm exec tsx scripts/backfill-contract-workflow.ts
 */
import "dotenv/config";
import { prisma } from "../src/utils/prisma";

async function getContractFallbackWorkflowId(): Promise<string | null> {
  const wf = await prisma.workflowDefinition.findFirst({
    where: { moduleKey: "contract", isActive: true, deletedAt: null },
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  return wf?.id ?? null;
}

async function main() {
  const contracts = await prisma.contract.findMany({
    where: { deletedAt: null, workflowId: null },
    select: { id: true, code: true },
  });
  const fallbackId = await getContractFallbackWorkflowId();
  let attached = 0;
  for (const contract of contracts) {
    if (!fallbackId) continue;
    await prisma.contract.update({
      where: { id: contract.id },
      data: { workflowId: fallbackId },
    });
    attached += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] contracts: ${attached}/${contracts.length} attached workflow.`);
}

void main().then(() => process.exit(0)).catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
