/**
 * Backfill warranty_step_payloads từ cột phẳng trên warranties.
 * Chạy: pnpm --filter backend exec tsx scripts/backfill-warranty-step-payloads.ts
 */
import { prisma } from "../src/utils/prisma";
import { flatRowToStepPayloadsByIndex, getOrderedStepIdsForWarranty, upsertStepPayloads } from "../src/modules/warranties/step-payload";

async function main() {
  const rows = await prisma.warranty.findMany({
    where: { deletedAt: null, workflowInstanceId: { not: null } },
    select: {
      id: true,
      issue: true,
      source: true,
      type: true,
      priorityCode: true,
      statusCode: true,
      receiptCategory: true,
      occurredAt: true,
      productSerialSnapshot: true,
      rootCause: true,
      handlingPlan: true,
      plannedHours: true,
      costEstimate: true,
      customerDisagreedClose: true,
      executionMode: true,
      outsourcePartner: true,
      outsourceBudget: true,
      outsourceTimeline: true,
      repairDetails: true,
      postRepairAssessment: true,
      handoverNotes: true,
    },
  });

  let ok = 0;
  let skip = 0;
  for (const row of rows) {
    const stepIds = await getOrderedStepIdsForWarranty(row.id);
    if (stepIds.length === 0) {
      skip++;
      continue;
    }
    const map = flatRowToStepPayloadsByIndex(row, stepIds);
    await upsertStepPayloads(row.id, map);
    ok++;
  }
  // eslint-disable-next-line no-console
  console.log(`Backfill done: ${ok} updated, ${skip} skipped (no steps).`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
