/**
 * Backfill workflow instances cho tất cả sản phẩm chưa có quy trình.
 * Nếu SP đã ở trạng thái cuối (equipped) thì advance instance đến completed.
 *
 * Usage: cd backend && pnpm exec tsx scripts/backfill-product-workflow.ts
 */
import "dotenv/config";
import { prisma } from "../src/utils/prisma";
import { startInstanceForEntity } from "../src/modules/workflows/runtime";

const STATUS_TO_STEP_INDEX: Record<string, number | "completed"> = {
  producing: 1,
  produced: 1,
  inspection_submitted: 2,
  inspecting: 2,
  inspection_passed: 2,
  decision_approved: 3,
  equip_decided: 3,
  equipped: "completed",
  developing: 1,
  stopped: 1,
};

async function main() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, status: true },
  });

  // eslint-disable-next-line no-console
  console.log(`[backfill] found ${products.length} products without workflow`);

  let ok = 0;
  for (const product of products) {
    try {
      const init = await startInstanceForEntity("product", product.id);
      if (!init) {
        // eslint-disable-next-line no-console
        console.warn(`[backfill] product ${product.id} — no active workflow found, skipped`);
        continue;
      }

      const target = STATUS_TO_STEP_INDEX[product.status] ?? 1;
      if (target === "completed") {
        const inst = await prisma.workflowInstance.findUnique({
          where: { id: init.instanceId },
          select: { id: true, workflow: { select: { steps: { orderBy: { order: "asc" as const }, select: { id: true } } } } },
        });
        if (inst) {
          const lastStep = inst.workflow.steps[inst.workflow.steps.length - 1];
          await prisma.workflowInstance.update({
            where: { id: inst.id },
            data: { status: "completed", completedAt: new Date(), currentStepId: lastStep?.id ?? null },
          });
        }
      } else if (typeof target === "number" && target > 1) {
        const inst = await prisma.workflowInstance.findUnique({
          where: { id: init.instanceId },
          select: { id: true, workflow: { select: { steps: { orderBy: { order: "asc" as const }, select: { id: true } } } } },
        });
        if (inst && inst.workflow.steps.length >= target) {
          const targetStep = inst.workflow.steps[target - 1]!;
          await prisma.workflowInstance.update({
            where: { id: inst.id },
            data: { currentStepId: targetStep.id },
          });
        }
      }

      ok += 1;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[backfill] product ${product.id} skipped:`, e);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[backfill] products: ${ok}/${products.length} attached workflow.`);
}

void main()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
