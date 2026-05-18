import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { pruneStepPayloadsNotIn as pruneContractStepPayloadsNotIn } from "../contracts/step-payload";
import { pruneStepPayloadsNotIn as pruneHandoverStepPayloadsNotIn } from "../handovers/step-payload";
import { pruneStepPayloadsNotIn as pruneWarrantyStepPayloadsNotIn } from "../warranties/step-payload";

export const WORKFLOW_INSTANCE_SELECT = {
  id: true,
  workflowId: true,
  moduleKey: true,
  entityId: true,
  currentStepId: true,
  status: true,
  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  workflow: {
    select: {
      id: true,
      code: true,
      name: true,
      moduleKey: true,
      isActive: true,
      isSystem: true,
      steps: {
        orderBy: { order: "asc" as const },
        select: {
          id: true,
          order: true,
          name: true,
          actionCode: true,
          roleCode: true,
          slaHours: true,
          description: true,
          phaseCode: true,
          requireDocument: true,
        },
      },
    },
  },
  currentStep: {
    select: {
      id: true,
      order: true,
      name: true,
      actionCode: true,
      roleCode: true,
      slaHours: true,
      phaseCode: true,
      requireDocument: true,
    },
  },
  logs: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      stepId: true,
      actorId: true,
      action: true,
      comment: true,
      createdAt: true,
      actor: { select: { id: true, fullName: true } },
      step: { select: { id: true, name: true, order: true } },
    },
  },
  documents: {
    orderBy: { uploadedAt: "desc" as const },
    select: {
      id: true,
      stepId: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      storagePath: true,
      uploadedById: true,
      uploadedAt: true,
      uploadedBy: { select: { id: true, fullName: true } },
    },
  },
} satisfies Prisma.WorkflowInstanceSelect;

type EntityModuleKey = "handover" | "warranty" | "training" | "contract";

async function resolveContractIdForEntity(
  moduleKey: EntityModuleKey,
  entityId: string,
): Promise<string | null> {
  if (moduleKey === "handover") {
    const row = await prisma.handover.findUnique({
      where: { id: entityId },
      select: { contractId: true },
    });
    return row?.contractId ?? null;
  }
  if (moduleKey === "warranty") {
    const row = await prisma.warranty.findUnique({
      where: { id: entityId },
      select: { contractId: true },
    });
    return row?.contractId ?? null;
  }
  const row = await prisma.trainingCourse.findUnique({
    where: { id: entityId },
    select: { contractId: true },
  });
  return row?.contractId ?? null;
}

async function findWorkflowForContract(contractId: string) {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { workflowId: true },
  });
  if (contract?.workflowId) {
    const wf = await prisma.workflowDefinition.findFirst({
      where: { id: contract.workflowId, deletedAt: null, isActive: true },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (wf && wf.steps.length > 0) return wf;
  }
  return null;
}

/**
 * Tìm workflow active mặc định cho một module và khởi tạo instance bám vào step đầu.
 * Contract: legacy Contract.workflowId nếu còn. Handover/training: chỉ workflow moduleKey tương ứng.
 * Trả về `null` nếu chưa có workflow active. `firstStepIndex` 1-based.
 */
export async function startInstanceForEntity(
  moduleKey: EntityModuleKey,
  entityId: string,
  actorId?: string | null,
): Promise<{ instanceId: string; firstStepIndex: number } | null> {
  type WorkflowWithSteps = Prisma.WorkflowDefinitionGetPayload<{
    include: { steps: true };
  }>;
  let workflow: WorkflowWithSteps | null = null;

  if (moduleKey === "contract") {
    workflow = await findWorkflowForContract(entityId);
  }
  if (!workflow) {
    workflow = await prisma.workflowDefinition.findFirst({
      where: { moduleKey, isActive: true, deletedAt: null },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      include: {
        steps: { orderBy: { order: "asc" } },
      },
    });
  }
  if (!workflow || workflow.steps.length === 0) return null;
  const firstStep = workflow.steps[0]!;

  const instance = await prisma.workflowInstance.create({
    data: {
      workflowId: workflow.id,
      moduleKey,
      entityId,
      currentStepId: firstStep.id,
      status: "running",
      logs: {
        create: {
          stepId: firstStep.id,
          actorId: actorId ?? null,
          action: "start",
          comment: null,
        },
      },
    },
    select: { id: true },
  });
  return { instanceId: instance.id, firstStepIndex: 1 };
}

export async function getInstanceForEntity(
  moduleKey: EntityModuleKey,
  entityId: string,
) {
  return prisma.workflowInstance.findFirst({
    where: { moduleKey, entityId },
    orderBy: { createdAt: "desc" },
    select: WORKFLOW_INSTANCE_SELECT,
  });
}

/**
 * Đổi workflow đang áp dụng cho một entity: đóng instance hiện tại (nếu đang running) và tạo
 * instance mới gắn vào workflow được chọn (bắt đầu từ step đầu).
 */
export async function attachWorkflowToEntity(args: {
  moduleKey: EntityModuleKey;
  entityId: string;
  workflowId: string;
  actorId?: string | null;
}) {
  const workflow = await prisma.workflowDefinition.findFirst({
    where: { id: args.workflowId, deletedAt: null },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!workflow) throw new HttpError(404, "Không tìm thấy quy trình");
  // Cho phép workflow contract áp dụng cho mọi entity (handover/warranty/training).
  if (workflow.moduleKey !== args.moduleKey && workflow.moduleKey !== "contract") {
    throw new HttpError(400, `Quy trình thuộc nhóm ${workflow.moduleKey}, không khớp với ${args.moduleKey}.`);
  }
  if (!workflow.isActive) {
    throw new HttpError(400, "Quy trình đang tắt — không thể áp dụng.");
  }
  if (workflow.steps.length === 0) {
    throw new HttpError(400, "Quy trình chưa có bước nào — không thể áp dụng.");
  }
  const firstStep = workflow.steps[0]!;

  const newInstance = await prisma.$transaction(async (tx) => {
    const current = await tx.workflowInstance.findFirst({
      where: { moduleKey: args.moduleKey, entityId: args.entityId, status: "running" },
    });
    if (current) {
      await tx.workflowInstance.update({
        where: { id: current.id },
        data: { status: "cancelled", completedAt: new Date() },
      });
      await tx.workflowStepLog.create({
        data: {
          instanceId: current.id,
          stepId: current.currentStepId,
          actorId: args.actorId ?? null,
          action: "skip",
          comment: "Đổi sang quy trình khác",
        },
      });
    }
    const created = await tx.workflowInstance.create({
      data: {
        workflowId: workflow.id,
        moduleKey: args.moduleKey,
        entityId: args.entityId,
        currentStepId: firstStep.id,
        status: "running",
        logs: {
          create: {
            stepId: firstStep.id,
            actorId: args.actorId ?? null,
            action: "start",
            comment: null,
          },
        },
      },
      select: { id: true },
    });

    if (args.moduleKey === "handover") {
      await tx.handover.updateMany({
        where: { id: args.entityId },
        data: { workflowInstanceId: created.id, currentStep: 1, status: "pending", completedAt: null },
      });
    } else if (args.moduleKey === "warranty") {
      await tx.warranty.updateMany({
        where: { id: args.entityId },
        data: {
          workflowInstanceId: created.id,
          workflowStep: 1,
          status: "open",
          statusCode: "open",
          resolvedAt: null,
        },
      });
    } else if (args.moduleKey === "training") {
      await tx.trainingCourse.updateMany({
        where: { id: args.entityId },
        data: { workflowInstanceId: created.id, status: "planned" },
      });
    } else if (args.moduleKey === "contract") {
      await tx.contract.updateMany({
        where: { id: args.entityId },
        data: { workflowInstanceId: created.id, workflowId: workflow.id },
      });
    }
    return created;
  });

  if (args.moduleKey === "warranty") {
    await pruneWarrantyStepPayloadsNotIn(
      args.entityId,
      workflow.steps.map((s) => s.id),
    );
  } else if (args.moduleKey === "handover") {
    await pruneHandoverStepPayloadsNotIn(
      args.entityId,
      workflow.steps.map((s) => s.id),
    );
  } else if (args.moduleKey === "contract") {
    await pruneContractStepPayloadsNotIn(
      args.entityId,
      workflow.steps.map((s) => s.id),
    );
  }

  return getInstanceByIdService(newInstance.id);
}

export async function getInstanceByIdService(id: string) {
  const row = await prisma.workflowInstance.findUnique({
    where: { id },
    select: WORKFLOW_INSTANCE_SELECT,
  });
  if (!row) throw new HttpError(404, "Không tìm thấy phiên xử lý");
  return row;
}

type AdvanceArgs = {
  instanceId: string;
  action: "approve" | "reject" | "skip";
  comment?: string | null;
  actorId: string;
  actorRoleCode: string;
};

export async function advanceInstanceService(args: AdvanceArgs) {
  const inst = await prisma.workflowInstance.findUnique({
    where: { id: args.instanceId },
    include: {
      workflow: { include: { steps: { orderBy: { order: "asc" } } } },
      currentStep: true,
    },
  });
  if (!inst) throw new HttpError(404, "Không tìm thấy phiên xử lý");
  if (inst.status !== "running") {
    throw new HttpError(409, "Phiên xử lý đã đóng — không thể tiếp tục.");
  }
  const step = inst.currentStep;
  if (!step) throw new HttpError(409, "Phiên xử lý chưa được gắn bước nào.");

  if (args.actorRoleCode !== step.roleCode && args.actorRoleCode !== "admin") {
    throw new HttpError(
      403,
      `Bước này yêu cầu vai trò «${step.roleCode}», bạn đang là «${args.actorRoleCode}».`,
    );
  }

  if (step.requireDocument && args.action === "approve") {
    const docCount = await prisma.workflowInstanceDocument.count({
      where: { instanceId: inst.id, stepId: step.id },
    });
    if (docCount === 0) {
      throw new HttpError(400, "Cần đính kèm tài liệu trước khi chuyển bước");
    }
  }

  const orderedSteps = inst.workflow.steps;
  const currentIdx = orderedSteps.findIndex((s) => s.id === step.id);
  const isLast = currentIdx === orderedSteps.length - 1;

  let nextStepId: string | null = null;
  let nextIndex: number | null = null;
  let newStatus: "running" | "completed" | "cancelled" = "running";

  if (args.action === "reject") {
    newStatus = "cancelled";
  } else if (isLast) {
    newStatus = "completed";
  } else {
    const next = orderedSteps[currentIdx + 1]!;
    nextStepId = next.id;
    nextIndex = currentIdx + 2;
  }

  await prisma.$transaction(async (tx) => {
    await tx.workflowStepLog.create({
      data: {
        instanceId: inst.id,
        stepId: step.id,
        actorId: args.actorId,
        action: args.action,
        comment: args.comment ?? null,
      },
    });
    await tx.workflowInstance.update({
      where: { id: inst.id },
      data: {
        currentStepId: newStatus === "completed" ? null : nextStepId ?? step.id,
        status: newStatus,
        ...(newStatus !== "running" ? { completedAt: new Date() } : {}),
      },
    });

    if (inst.moduleKey === "handover") {
      if (nextIndex != null && newStatus === "running") {
        await tx.handover.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { currentStep: nextIndex, status: "active" },
        });
      }
      if (newStatus === "completed") {
        await tx.handover.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { status: "completed", completedAt: new Date(), currentStep: orderedSteps.length },
        });
      }
      if (newStatus === "cancelled") {
        await tx.handover.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { status: "late" },
        });
      }
    }

    if (inst.moduleKey === "warranty") {
      if (nextIndex != null && newStatus === "running") {
        await tx.warranty.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { workflowStep: nextIndex, status: "processing", statusCode: "processing" },
        });
      }
      if (newStatus === "completed") {
        await tx.warranty.updateMany({
          where: { workflowInstanceId: inst.id },
          data: {
            workflowStep: orderedSteps.length,
            status: "completed",
            statusCode: "completed",
            resolvedAt: new Date(),
          },
        });
      }
      if (newStatus === "cancelled") {
        await tx.warranty.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { status: "cancelled", statusCode: "cancelled" },
        });
      }
    }

    if (inst.moduleKey === "training" && newStatus === "completed") {
      await tx.trainingCourse.updateMany({
        where: { workflowInstanceId: inst.id },
        data: { status: "completed" },
      });
    }
    if (inst.moduleKey === "training" && newStatus === "running" && nextIndex != null) {
      await tx.trainingCourse.updateMany({
        where: { workflowInstanceId: inst.id },
        data: { status: "ongoing" },
      });
    }

    if (inst.moduleKey === "contract") {
      const totalSteps = orderedSteps.length;
      if (newStatus === "running" && nextIndex != null) {
        const progress = totalSteps > 0 ? Math.round((nextIndex / totalSteps) * 100) : 0;
        await tx.contract.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { progress: Math.min(100, progress) },
        });
      }
      if (newStatus === "completed") {
        await tx.contract.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { progress: 100, status: "completed" },
        });
      }
      if (newStatus === "cancelled") {
        await tx.contract.updateMany({
          where: { workflowInstanceId: inst.id },
          data: { status: "late" },
        });
      }
    }
  });

  return getInstanceByIdService(args.instanceId);
}
