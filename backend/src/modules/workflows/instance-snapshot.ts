import { prisma } from "../../utils/prisma";

export type WorkflowStepSnapshot = {
  id: string;
  order: number;
  name: string;
  actionCode: string;
  roleCode: string;
  slaHours: number | null;
  assigneeIds: string[];
};

export type WorkflowSnapshot = {
  instanceId: string;
  workflowId: string;
  workflowCode: string;
  workflowName: string;
  status: string;
  currentStepIndex: number;
  totalSteps: number;
  currentStepName: string | null;
  currentStepRoleCode: string | null;
  currentStepAssigneeIds: string[];
  steps: WorkflowStepSnapshot[];
};

/** Snapshot tiến độ instance (dùng cho danh sách bàn giao / bảo hành, …). */
export async function loadWorkflowSnapshotsByInstanceIds(ids: Array<string | null>) {
  const filtered = ids.filter((id): id is string => Boolean(id));
  const map = new Map<string, WorkflowSnapshot>();
  if (filtered.length === 0) return map;

  const instances = await prisma.workflowInstance.findMany({
    where: { id: { in: filtered } },
    select: {
      id: true,
      status: true,
      workflowId: true,
      currentStepId: true,
      workflow: {
        select: {
          code: true,
          name: true,
          steps: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              name: true,
              actionCode: true,
              roleCode: true,
              slaHours: true,
              assigneeIds: true,
            },
          },
        },
      },
    },
  });

  for (const inst of instances) {
    const steps = inst.workflow.steps;
    const idx = inst.currentStepId ? steps.findIndex((s) => s.id === inst.currentStepId) : -1;
    const currentStep = idx >= 0 ? steps[idx] : null;
    map.set(inst.id, {
      instanceId: inst.id,
      workflowId: inst.workflowId,
      workflowCode: inst.workflow.code,
      workflowName: inst.workflow.name,
      status: inst.status,
      currentStepIndex: idx >= 0 ? idx + 1 : 0,
      totalSteps: steps.length,
      currentStepName: currentStep?.name ?? null,
      currentStepRoleCode: currentStep?.roleCode ?? null,
      currentStepAssigneeIds: currentStep?.assigneeIds ?? [],
      steps,
    });
  }
  return map;
}
