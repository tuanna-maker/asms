import { prisma } from "../utils/prisma";
import { attachWorkflowToEntity } from "../modules/workflows/runtime";
import { getOrderedStepIdsForCourse, upsertStepPayloads } from "../modules/training/step-payload";

/**
 * Gắn quy trình huấn luyện (coaching) cho khóa HL demo và mẫu payload bước 1.
 * Chạy sau seedWorkflows() — cần WF_COACHING_DEFAULT / WF_COACHING_HANDOVER_H.
 */
export async function seedCoachingWorkflowDemo(actorId: string) {
  const wfByCode = async (code: string) =>
    prisma.workflowDefinition.findFirst({
      where: { code, deletedAt: null, isActive: true },
      select: { id: true },
    });

  const wfDefault = await wfByCode("WF_COACHING_DEFAULT");
  const wfHandoverH = await wfByCode("WF_COACHING_HANDOVER_H");

  const links: Array<{
    courseCode: string;
    workflowId: string | undefined;
    firstStepPayload?: Record<string, string>;
  }> = [
    {
      courseCode: "HL-2026-03",
      workflowId: wfDefault?.id,
      firstStepPayload: {
        trainingPlanNote:
          "Kế hoạch huấn luyện R-300QP — 28 học viên QK1, 10 ngày tại Trường huấn Vĩnh Phúc.",
        tempHandoverNote: "",
      },
    },
    { courseCode: "HL-2026-05", workflowId: wfHandoverH?.id },
    { courseCode: "HL-2026-01", workflowId: wfDefault?.id },
  ];

  for (const link of links) {
    if (!link.workflowId) continue;
    const course = await prisma.trainingCourse.findUnique({
      where: { code: link.courseCode },
      select: { id: true },
    });
    if (!course) continue;

    await prisma.trainingCourse.update({
      where: { id: course.id },
      data: { courseKind: "coaching" },
    });

    const running = await prisma.workflowInstance.findFirst({
      where: { moduleKey: "coaching", entityId: course.id, status: "running" },
      select: { id: true },
    });
    if (!running) {
      await attachWorkflowToEntity({
        moduleKey: "coaching",
        entityId: course.id,
        workflowId: link.workflowId,
        actorId,
      });
    }

    if (link.firstStepPayload) {
      const stepIds = await getOrderedStepIdsForCourse(course.id);
      const firstStepId = stepIds[0];
      if (firstStepId) {
        await upsertStepPayloads(course.id, { [firstStepId]: link.firstStepPayload });
      }
    }
  }
}
