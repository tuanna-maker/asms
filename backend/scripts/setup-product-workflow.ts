/**
 * Tạo/cập nhật quy trình sản phẩm mẫu (WF_PRODUCT_DEFAULT) và gán cho mọi SP chưa có quy trình.
 *
 * Usage: cd backend && pnpm exec tsx scripts/setup-product-workflow.ts
 */
import "dotenv/config";
import { seedWorkflows } from "../src/config/seed-workflows";
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

async function backfillProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, workflowInstanceId: null },
    select: { id: true, status: true },
  });

  // eslint-disable-next-line no-console
  console.log(`[setup] ${products.length} sản phẩm chưa có quy trình`);

  let ok = 0;
  for (const product of products) {
    try {
      const init = await startInstanceForEntity("product", product.id);
      if (!init) {
        // eslint-disable-next-line no-console
        console.warn(`[setup] SP ${product.id}: không tìm thấy quy trình active, bỏ qua`);
        continue;
      }

      const target = STATUS_TO_STEP_INDEX[product.status] ?? 1;
      const inst = await prisma.workflowInstance.findUnique({
        where: { id: init.instanceId },
        select: {
          id: true,
          workflow: {
            select: { steps: { orderBy: { order: "asc" as const }, select: { id: true } } },
          },
        },
      });

      if (!inst) continue;

      if (target === "completed") {
        const lastStep = inst.workflow.steps[inst.workflow.steps.length - 1];
        await prisma.workflowInstance.update({
          where: { id: inst.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            currentStepId: lastStep?.id ?? null,
          },
        });
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "equipped" },
        });
      } else if (typeof target === "number" && target > 1) {
        const targetStep = inst.workflow.steps[target - 1];
        if (targetStep) {
          await prisma.workflowInstance.update({
            where: { id: inst.id },
            data: { currentStepId: targetStep.id },
          });
        }
        const statusMap: Record<number, string> = {
          2: "inspecting",
          3: "equip_decided",
        };
        const mapped = statusMap[target];
        if (mapped) {
          await prisma.product.update({
            where: { id: product.id },
            data: { status: mapped as never },
          });
        }
      }

      ok += 1;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[setup] SP ${product.id} lỗi:`, e);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[setup] Đã gán quy trình: ${ok}/${products.length} sản phẩm`);
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("[setup] Đang seed quy trình sản phẩm…");
  await seedWorkflows();

  const wf = await prisma.workflowDefinition.findUnique({
    where: { code: "WF_PRODUCT_DEFAULT" },
    select: { id: true, name: true, isActive: true, steps: { orderBy: { order: "asc" }, select: { name: true, order: true } } },
  });
  if (!wf) {
    throw new Error("WF_PRODUCT_DEFAULT chưa được tạo — kiểm tra seed");
  }
  // eslint-disable-next-line no-console
  console.log(`[setup] Quy trình: ${wf.name} (${wf.steps.length} bước, active=${wf.isActive})`);
  wf.steps.forEach((s) => {
    // eslint-disable-next-line no-console
    console.log(`  - ${s.order / 10}. ${s.name}`);
  });

  await backfillProducts();
}

void main()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
