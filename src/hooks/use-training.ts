import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ScheduleSession, TrainingCourse, Trainee } from "@/data/trainingData";
import type { WorkflowInstanceListSnapshot } from "@/hooks/use-workflows-api";
import { parseCourseKind, type TrainingCourseKind } from "@/lib/training-course-kind";
import type { TrainingStepPayloadRecord } from "@/lib/training-step-payload";

function toDateInputValue(iso: unknown) {
  if (!iso) return "";
  if (typeof iso !== "string") return String(iso);
  if (iso.includes("T")) return new Date(iso).toISOString().slice(0, 10);
  return iso;
}

function mapTrainingStatus(uiStatus: string): TrainingCourse["status"] {
  if (uiStatus === "cancelled") return "planned";
  if (uiStatus === "planned" || uiStatus === "ongoing" || uiStatus === "completed") return uiStatus;
  return "planned";
}

type TrainingCourseType = TrainingCourse["type"];

type PersonRef = { id: string; fullName?: string; name?: string; code?: string };

type TrainingCourseListRow = {
  id: string;
  code?: string;
  contractId?: string | null;
  customerId?: string | null;
  instructorId?: string | null;
  title: string;
  type: TrainingCourseType;
  startDate: string;
  endDate: string;
  participants: number;
  status: string;
  location?: string | null;
  courseKind?: string | null;
  description?: string | null;
  workflowInstanceId?: string | null;
  workflow?: WorkflowInstanceListSnapshot | null;
  stepPayloads?: TrainingStepPayloadRecord;
  customer?: PersonRef | null;
  instructor?: { id: string; fullName: string } | null;
  contract?: { id: string; code: string } | null;
};

type TraineeRow = {
  id: string;
  fullName: string;
  unit?: string | null;
  rank?: string | null;
  attendance: Trainee["attendance"];
  score?: string | number | null;
};

type ScheduleSessionRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  location?: string | null;
  status: ScheduleSession["status"];
};

type TrainingCourseDetailRow = TrainingCourseListRow & {
  trainees?: TraineeRow[];
  sessions?: ScheduleSessionRow[];
  stepPayloads?: TrainingStepPayloadRecord;
};

type ApiSuccess<T> = { success: true; data: T; message?: string };

function mapCourseRow(row: TrainingCourseListRow): TrainingCourse {
  return {
    id: row.id,
    code: row.code,
    courseKind: parseCourseKind(row.courseKind),
    contractId: row.contract?.id ?? row.contractId ?? null,
    customerId: row.customer?.id ?? row.customerId ?? null,
    instructorId: row.instructor?.id ?? row.instructorId ?? null,
    customerName: row.customer?.name ?? row.customer?.code ?? undefined,
    instructorName: row.instructor?.fullName ?? undefined,
    title: row.title,
    type: row.type,
    startDate: toDateInputValue(row.startDate),
    endDate: toDateInputValue(row.endDate),
    participants: Number(row.participants ?? 0),
    status: mapTrainingStatus(row.status),
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    workflowInstanceId: row.workflowInstanceId ?? null,
    workflow: row.workflow ?? null,
    stepPayloads: row.stepPayloads,
    trainees: [],
    schedule: [],
  };
}

function mapTrainee(t: unknown): Trainee {
  const trainee = t as TraineeRow;
  const scoreRaw = trainee.score;
  const scoreNum = typeof scoreRaw === "string" || typeof scoreRaw === "number" ? Number(scoreRaw) : undefined;
  return {
    id: trainee.id,
    name: trainee.fullName,
    unit: trainee.unit ?? "",
    rank: trainee.rank ?? undefined,
    attendance: trainee.attendance,
    score: typeof scoreNum === "number" && Number.isFinite(scoreNum) ? scoreNum : undefined,
  };
}

function mapSchedule(s: unknown): ScheduleSession {
  const sess = s as ScheduleSessionRow;
  return {
    id: sess.id,
    date: toDateInputValue(sess.date),
    startTime: sess.startTime,
    endTime: sess.endTime,
    topic: sess.topic,
    location: sess.location ?? "",
    status: sess.status,
  };
}

async function fetchTrainingCourses(courseKind?: TrainingCourseKind): Promise<TrainingCourse[]> {
  const params = courseKind ? { courseKind } : undefined;
  const res = await api.get<ApiSuccess<TrainingCourseListRow[]>>("/api/v1/training", { params });
  const rows = res.data.data ?? [];
  return rows.map(mapCourseRow);
}

async function fetchTrainingCourseDetail(id: string): Promise<TrainingCourseDetailRow> {
  const res = await api.get<ApiSuccess<TrainingCourseDetailRow>>(`/api/v1/training/${id}`);
  return res.data.data;
}

export function useTrainingCoursesQuery(opts?: { courseKind?: TrainingCourseKind }) {
  const courseKind = opts?.courseKind;
  return useQuery({
    queryKey: ["trainingCourses", courseKind ?? "all"],
    queryFn: () => fetchTrainingCourses(courseKind),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Mặc định lấy tất cả khóa (đào tạo + huấn luyện) — truyền courseKind để lọc. */
export const useTrainingCourses = (courseKind?: TrainingCourseKind) => {
  const { data = [] } = useTrainingCoursesQuery(courseKind !== undefined ? { courseKind } : undefined);
  return data;
};

export const useTrainingCourse = (id: string | undefined) => {
  const { data: all = [] } = useTrainingCoursesQuery();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["trainingCourse", id],
    queryFn: () => fetchTrainingCourseDetail(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const mappedDetail: TrainingCourse | undefined =
    data == null
      ? undefined
      : {
          ...mapCourseRow(data),
          stepPayloads: data.stepPayloads,
          trainees: Array.isArray(data.trainees) ? data.trainees.map(mapTrainee) : [],
          schedule: Array.isArray(data.sessions) ? data.sessions.map(mapSchedule) : [],
        };

  const listCourse = id ? all.find((c) => c.id === id) : undefined;
  const course = mappedDetail ?? listCourse;
  return {
    course,
    isLoading: Boolean(id) && isLoading && !course,
    isError,
    error,
  };
};
