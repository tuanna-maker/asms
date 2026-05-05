import type { ResearchProject, ResearchTask } from "@/data/researchData";

export type ApiResearchProjectListRow = {
  id: string;
  code: string;
  name: string;
  department: string | null;
  fundingSource: string | null;
  startDate: string;
  endDate: string;
  status: ResearchProject["status"];
  progress: number;
  budget: string | number | null;
  budgetSpent: string | number | null;
  description: string | null;
  manager: { id: string; fullName: string } | null;
  _count?: { tasks: number };
};

export type ApiResearchTaskRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  priority: string;
  startDate: string | null;
  deadline: string | null;
  assignee: { id: string; fullName: string } | null;
};

export type ApiResearchProjectDetail = ApiResearchProjectListRow & {
  tasks: ApiResearchTaskRow[];
};

function isoToDateOnly(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const emptyNested = (): Pick<
  ResearchProject,
  | "members"
  | "tasks"
  | "deliverables"
  | "budgetItems"
  | "councilMembers"
  | "basisItems"
  | "deploymentItems"
  | "cooperationItems"
> => ({
  members: [],
  tasks: [],
  deliverables: [],
  budgetItems: [],
  councilMembers: [],
  basisItems: [],
  deploymentItems: [],
  cooperationItems: [],
});

export function mapResearchProjectListRow(row: ApiResearchProjectListRow): ResearchProject {
  const nested = emptyNested();
  return {
    id: row.code,
    backendId: row.id,
    code: row.code,
    name: row.name,
    manager: row.manager?.fullName ?? "",
    department: row.department ?? "",
    fundingSource: row.fundingSource ?? "",
    startDate: isoToDateOnly(row.startDate),
    endDate: isoToDateOnly(row.endDate),
    status: row.status,
    progress: Number(row.progress ?? 0),
    description: row.description ?? "",
    budget: row.budget != null ? Number(row.budget) : 0,
    budgetSpent: row.budgetSpent != null ? Number(row.budgetSpent) : 0,
    ...nested,
  };
}

const taskStatusMap: Record<string, ResearchTask["status"]> = {
  todo: "not_started",
  in_progress: "in_progress",
  review: "in_progress",
  completed: "completed",
  delayed: "delayed",
};

function mapResearchTask(t: ApiResearchTaskRow): ResearchTask {
  return {
    id: t.code,
    title: t.title,
    assignee: t.assignee?.fullName ?? "",
    startDate: t.startDate ? isoToDateOnly(t.startDate) : "",
    endDate: t.deadline ? isoToDateOnly(t.deadline) : "",
    status: taskStatusMap[t.status] ?? "not_started",
    progress: Number(t.progress ?? 0),
    priority: (t.priority as ResearchTask["priority"]) || undefined,
    description: t.description ?? undefined,
  };
}

export function mapResearchProjectDetail(row: ApiResearchProjectDetail): ResearchProject {
  const base = mapResearchProjectListRow(row);
  return {
    ...base,
    tasks: (row.tasks ?? []).map(mapResearchTask),
  };
}
