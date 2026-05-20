import type { ScheduleSession, Trainee, TrainingCourse } from "@/data/trainingData";
import type { TrainingCourseKind } from "@/lib/training-course-kind";
import type { TrainingStepPayloadRecord } from "@/lib/training-step-payload";

export function buildTrainingCoursePayload(
  form: Omit<TrainingCourse, "id">,
  workflowId?: string,
  courseKind: TrainingCourseKind = "training",
  stepPayloads?: TrainingStepPayloadRecord,
) {
  return {
    courseKind,
    title: form.title,
    typeCode: form.type,
    contractId: form.contractId || undefined,
    ...(form.customerId ? { customerId: form.customerId } : {}),
    ...(form.instructorId ? { instructorId: form.instructorId } : {}),
    startDate: form.startDate,
    endDate: form.endDate || form.startDate,
    participants: Number(form.participants ?? 0),
    status: form.status,
    ...(form.location?.trim() ? { location: form.location.trim() } : {}),
    ...(form.description ? { description: form.description } : {}),
    ...(workflowId ? { workflowId } : {}),
    ...(stepPayloads && Object.keys(stepPayloads).length > 0 ? { stepPayloads } : {}),
  };
}

export function buildTraineePayload(form: Omit<Trainee, "id">) {
  return {
    fullName: form.name,
    unit: form.unit,
    rank: form.rank || undefined,
    attendance: form.attendance,
    ...(form.score !== undefined ? { score: form.score } : {}),
  };
}

export function buildSessionPayload(form: Omit<ScheduleSession, "id">) {
  return {
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    topic: form.topic,
    location: form.location || undefined,
    status: form.status,
  };
}
