import { z } from "zod";

const roleCodeEnum = z.enum(["admin", "manager", "technician", "viewer", "sales"]);
const userStatusEnum = z.enum(["active", "inactive", "suspended"]);

export const listUsersQuerySchema = z.object({
  status: userStatusEnum.optional(),
  roleCode: roleCodeEnum.optional(),
  search: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roleCode: roleCodeEnum,
  status: userStatusEnum.optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  roleCode: roleCodeEnum.optional(),
  status: userStatusEnum.optional(),
});
