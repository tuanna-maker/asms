/**
 * Backfill `WorkflowInstance` cho các bàn giao / phiếu bảo hành / khoá đào tạo đã tạo trước khi
 * module Quy trình ra đời. Mỗi entity sẽ được khởi tạo bằng step đầu của workflow active mặc định.
 *
 * Usage: cd backend && pnpm exec tsx scripts/backfill-workflow-instances.ts
 */
import "dotenv/config";
import { prisma } from "../src/utils/prisma";
import { attachWorkflowToEntity, startInstanceForEntity } from "../src/modules/workflows/runtime";

async function backfillHandovers() {
  const rows = await prisma.handover.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, createdById: true },
  });
  let ok = 0;
  for (const row of rows) {
    const init = await startInstanceForEntity("handover", row.id, row.createdById ?? null);
    if (!init) continue;
    await prisma.handover.update({
      where: { id: row.id },
      data: { workflowInstanceId: init.instanceId, currentStep: init.firstStepIndex },
    });
    ok += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] handovers: ${ok}/${rows.length} attached.`);
}

async function backfillWarranties() {
  const rows = await prisma.warranty.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, assigneeId: true },
  });
  let ok = 0;
  for (const row of rows) {
    const init = await startInstanceForEntity("warranty", row.id, row.assigneeId ?? null);
    if (!init) continue;
    await prisma.warranty.update({
      where: { id: row.id },
      data: { workflowInstanceId: init.instanceId, workflowStep: init.firstStepIndex },
    });
    ok += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] warranties: ${ok}/${rows.length} attached.`);
}

async function backfillContracts() {
  const rows = await prisma.contract.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, workflowId: true, createdById: true },
  });
  let ok = 0;
  for (const row of rows) {
    try {
      if (row.workflowId) {
        await attachWorkflowToEntity({
          moduleKey: "contract",
          entityId: row.id,
          workflowId: row.workflowId,
          actorId: row.createdById ?? null,
        });
      } else {
        const init = await startInstanceForEntity("contract", row.id, row.createdById ?? null);
        if (!init) continue;
        await prisma.contract.update({
          where: { id: row.id },
          data: { workflowInstanceId: init.instanceId },
        });
      }
      ok += 1;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[backfill] contract ${row.id} skipped:`, e);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] contracts: ${ok}/${rows.length} attached.`);
}

async function backfillTrainings() {
  const rows = await prisma.trainingCourse.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, instructorId: true },
  });
  let ok = 0;
  for (const row of rows) {
    const init = await startInstanceForEntity("training", row.id, row.instructorId ?? null);
    if (!init) continue;
    await prisma.trainingCourse.update({
      where: { id: row.id },
      data: { workflowInstanceId: init.instanceId },
    });
    ok += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] training courses: ${ok}/${rows.length} attached.`);
}

void (async () => {
  await backfillContracts();
  await backfillHandovers();
  await backfillWarranties();
  await backfillTrainings();
  process.exit(0);
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
