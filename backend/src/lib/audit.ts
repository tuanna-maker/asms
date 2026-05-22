import type { Request } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma";

export type AuditEntity =
  | "user"
  | "role"
  | "definition"
  | "contract"
  | "handover"
  | "warranty"
  | "material"
  | "material_transfer"
  | "product"
  | "task"
  | "training_course"
  | "document"
  | "customer"
  | "system_setting"
  | "workflow"
  | "workflow_step"
  | "workflow_instance"
  | "contract_clause"
  | "contract_clause_group"
  | "auth";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "reorder"
  | "advance"
  | "login"
  | "logout"
  | "logout_all"
  | "session_revoke"
  | "password_change"
  | "settings_update";

export type WriteAuditInput = {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  summary?: string | null;
  payload?: Record<string, unknown> | null;
};

function getClientIp(req: Request): string | null {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0]!.trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0] ?? null;
  return req.ip ?? null;
}

/**
 * Ghi nhật ký truy vết. Không ném lỗi ra ngoài để tránh làm hỏng request chính.
 */
function payloadInput(payload: Record<string, unknown> | null | undefined): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  if (payload === undefined || payload === null) return Prisma.JsonNull;
  return payload as Prisma.InputJsonValue;
}

export async function writeAudit(req: Request, input: WriteAuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        payload: payloadInput(input.payload),
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        ip: getClientIp(req),
        userAgent: typeof req.headers["user-agent"] === "string" ? req.headers["user-agent"] : null,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[audit] writeAudit failed", e);
  }
}

/**
 * Ghi nhật ký từ tác vụ nội bộ (cron, seed) — không có req.
 */
export async function writeSystemAudit(input: WriteAuditInput & { actorId?: string | null }) {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        payload: payloadInput(input.payload),
        actorId: input.actorId ?? null,
        actorRole: "system",
        ip: null,
        userAgent: null,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[audit] writeSystemAudit failed", e);
  }
}
