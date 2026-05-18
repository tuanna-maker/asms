import { z } from "zod";

export const trainingStatusSchema = z.enum(["planned", "ongoing", "completed", "cancelled"]);

export const createTrainingCourseSchema = z.object({
  code: z.string().optional(),
  contractId: z.string().optional(),
  customerId: z.string().optional(),
  instructorId: z.string().optional(),
  title: z.string().min(1),
  typeCode: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  participants: z.number().int().nonnegative().optional(),
  status: trainingStatusSchema.optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  workflowId: z.string().min(1).optional(),
});

export const updateTrainingCourseSchema = createTrainingCourseSchema.partial().extend({
  status: trainingStatusSchema.optional(),
  typeCode: z.string().min(1).optional(),
});

export const listTrainingQuerySchema = z.object({
  status: trainingStatusSchema.optional(),
  typeCode: z.string().optional(),
  contractId: z.string().optional(),
});

export const trainingIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createTraineeSchema = z.object({
  fullName: z.string().min(1),
  unit: z.string().optional(),
  rank: z.string().optional(),
  attendance: z.enum(["present", "absent", "pending"]),
  score: z.number().optional(),
});
export const updateTraineeSchema = createTraineeSchema.partial();

export const createScheduleSessionSchema = z.object({
  date: z.coerce.date(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  topic: z.string().min(1),
  location: z.string().optional(),
  status: z.enum(["planned", "done", "cancelled"]).optional(),
});
export const updateScheduleSessionSchema = createScheduleSessionSchema.partial();

export const traineeIdParamSchema = z.object({
  traineeId: z.string().min(1),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

