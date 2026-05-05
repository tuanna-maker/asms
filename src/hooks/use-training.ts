import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { ScheduleSession, TrainingCourse, Trainee } from "@/data/trainingData";

function toDateInputValue(iso: unknown) {
  if (!iso) return "";
  if (typeof iso !== "string") return String(iso);
  // Backend returns ISO strings; UI expects `YYYY-MM-DD` for <input type="date" />
  if (iso.includes("T")) return new Date(iso).toISOString().slice(0, 10);
  return iso;
}

function mapTrainingStatus(uiStatus: string): TrainingCourse["status"] {
  // UI doesn't include `cancelled`; map cancelled -> planned
  if (uiStatus === "cancelled") return "planned";
  if (uiStatus === "planned" || uiStatus === "ongoing" || uiStatus === "completed") return uiStatus;
  return "planned";
}

type TrainingCourseType = TrainingCourse["type"];
type TrainingCourseStatus = TrainingCourse["status"];

type TrainingCourseListRow = {
  id: string;
  code?: string;
  title: string;
  type: TrainingCourseType;
  startDate: string;
  endDate: string;
  participants: number;
  status: string;
  location?: string | null;
  description?: string | null;
  customer?: { id: string; code: string; name: string } | null;
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

type TrainingCourseDetailRow = {
  id: string;
  title: string;
  type: TrainingCourseType;
  instructorId?: string | null;
  customerId?: string | null;
  startDate: string;
  endDate: string;
  participants?: number | null;
  status: string;
  description?: string | null;
  location?: string | null;
  trainees?: TraineeRow[];
  sessions?: ScheduleSessionRow[];
};

type ApiSuccess<T> = { success: true; data: T; message?: string };

function mapCourseListItem(item: unknown): TrainingCourse {
  const row = item as TrainingCourseListRow;
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    instructor: "",
    customer: row.customer?.name ?? row.customer?.code ?? "",
    startDate: toDateInputValue(row.startDate),
    endDate: toDateInputValue(row.endDate),
    participants: Number(row.participants ?? 0),
    status: mapTrainingStatus(row.status),
    description: row.description ?? undefined,
    location: row.location ?? undefined,
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

async function fetchTrainingCourses(): Promise<TrainingCourse[]> {
  const res = await api.get<ApiSuccess<TrainingCourseListRow[]>>("/api/v1/training");
  const rows = res.data.data ?? [];
  return rows.map(mapCourseListItem);
}

async function fetchTrainingCourseDetail(id: string): Promise<TrainingCourseDetailRow> {
  const res = await api.get<ApiSuccess<TrainingCourseDetailRow>>(`/api/v1/training/${id}`);
  return res.data.data;
}

/** Kết quả useQuery đầy đủ (loading / error) — dùng khi cần, ví dụ `Handover`. */
export function useTrainingCoursesQuery() {
  return useQuery({
    queryKey: ["trainingCourses"],
    queryFn: fetchTrainingCourses,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export const useTrainingCourses = () => {
  const { data = [] } = useTrainingCoursesQuery();
  return data;
};

export const useTrainingCourse = (id: string | undefined) => {
  const all = useTrainingCourses();

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
          id: data.id,
          title: data.title,
          type: data.type,
          instructor: data.instructorId ?? "",
          customer: data.customerId ?? "",
          startDate: toDateInputValue(data.startDate),
          endDate: toDateInputValue(data.endDate),
          participants: Number(data.participants ?? 0),
          status: mapTrainingStatus(data.status),
          description: data.description ?? undefined,
          location: data.location ?? undefined,
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
