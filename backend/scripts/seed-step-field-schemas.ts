/**
 * Gán fieldSchema cho các bước workflow hiện có (theo template 5 bước + ghi chú cho bước thừa).
 *
 * Usage: cd backend && pnpm exec tsx scripts/seed-step-field-schemas.ts
 */
import "dotenv/config";
import { prisma } from "../src/utils/prisma";
import {
  CONTRACT_STEP_SCHEMAS,
  HANDOVER_ENTITY_FIELD_SCHEMA,
  HANDOVER_STEP_SCHEMAS,
  schemaForStepIndex,
  WARRANTY_STEP_SCHEMAS,
} from "../src/config/step-field-schema-templates";

const MODULE_TEMPLATES: Record<string, typeof HANDOVER_STEP_SCHEMAS> = {
  handover: HANDOVER_STEP_SCHEMAS,
  contract: CONTRACT_STEP_SCHEMAS,
  warranty: WARRANTY_STEP_SCHEMAS,
};

async function main() {
  const workflows = await prisma.workflowDefinition.findMany({
    where: { deletedAt: null, moduleKey: { in: ["handover", "contract", "warranty"] } },
    select: {
      id: true,
      code: true,
      moduleKey: true,
      steps: { orderBy: { order: "asc" }, select: { id: true, order: true, name: true } },
    },
  });

  let updatedSteps = 0;
  let updatedEntity = 0;
  for (const wf of workflows) {
    const templates = MODULE_TEMPLATES[wf.moduleKey];
    if (templates) {
      for (let i = 0; i < wf.steps.length; i++) {
        const step = wf.steps[i]!;
        const fieldSchema = schemaForStepIndex(templates, i);
        await prisma.workflowStep.update({
          where: { id: step.id },
          data: { fieldSchema },
        });
        updatedSteps += 1;
      }
    }
    if (wf.moduleKey === "handover") {
      await prisma.workflowDefinition.update({
        where: { id: wf.id },
        data: { entityFieldSchema: HANDOVER_ENTITY_FIELD_SCHEMA },
      });
      updatedEntity += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed-step-field-schemas] updated ${updatedSteps} steps, ${updatedEntity} handover entity schemas across ${workflows.length} workflows.`,
  );
}

void main()
  .then(() => process.exit(0))
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
