import type { ScheduleSession, Trainee, TrainingCourse } from "@/data/trainingData";

export function buildTrainingCoursePayload(form: Omit<TrainingCourse, "id">) {
  return {
    title: form.title,
    type: form.type,
    contractId: form.contractId || undefined,
    instructorId: form.instructor || undefined,
    customerId: form.customer || undefined,
    startDate: form.startDate,
    endDate: form.endDate || form.startDate,
    participants: Number(form.participants ?? 0),
    status: form.status,
    ...(form.location ? { location: form.location } : {}),
    ...(form.description ? { description: form.description } : {}),
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
