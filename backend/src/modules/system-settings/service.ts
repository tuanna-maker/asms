import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import {
  SYSTEM_SETTING_DEFS,
  SYSTEM_SETTING_DEF_BY_KEY,
  type SystemSettingDef,
  type SystemSettingKey,
} from "./defaults";

export type SystemSettingItem = {
  key: SystemSettingKey;
  value: Prisma.JsonValue;
  label: string;
  description: string;
  group: SystemSettingDef["group"];
  input: SystemSettingDef["input"];
  unit?: string;
  min?: number;
  max?: number;
  updatedAt: Date | null;
};

export async function ensureDefaultSystemSettings() {
  await Promise.all(
    SYSTEM_SETTING_DEFS.map(async (def) => {
      await prisma.systemSetting.upsert({
        where: { key: def.key },
        update: { label: def.label, description: def.description },
        create: {
          key: def.key,
          value: def.defaultValue as Prisma.InputJsonValue,
          label: def.label,
          description: def.description,
        },
      });
    }),
  );
}

export async function listSystemSettingsService(): Promise<SystemSettingItem[]> {
  await ensureDefaultSystemSettings();
  const rows = await prisma.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r] as const));

  return SYSTEM_SETTING_DEFS.map((def) => {
    const row = map.get(def.key);
    return {
      key: def.key,
      value: (row?.value ?? (def.defaultValue as Prisma.JsonValue)) as Prisma.JsonValue,
      label: def.label,
      description: def.description,
      group: def.group,
      input: def.input,
      ...(def.unit ? { unit: def.unit } : {}),
      ...(def.min !== undefined ? { min: def.min } : {}),
      ...(def.max !== undefined ? { max: def.max } : {}),
      updatedAt: row?.updatedAt ?? null,
    };
  });
}

function validateValueByDef(def: SystemSettingDef, value: unknown) {
  if (def.input === "number" || def.input === "hour") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new HttpError(400, `${def.label}: cần là số`);
    }
    if (def.min !== undefined && value < def.min) {
      throw new HttpError(400, `${def.label}: tối thiểu ${def.min}`);
    }
    if (def.max !== undefined && value > def.max) {
      throw new HttpError(400, `${def.label}: tối đa ${def.max}`);
    }
    return value;
  }
  if (def.input === "channels") {
    if (!Array.isArray(value)) throw new HttpError(400, `${def.label}: cần mảng kênh`);
    const ALLOWED = new Set(["in_app"]);
    const cleaned = (value as unknown[]).map((v) => String(v));
    for (const v of cleaned) {
      if (!ALLOWED.has(v)) throw new HttpError(400, `${def.label}: kênh «${v}» không hỗ trợ`);
    }
    return cleaned;
  }
  return value;
}

export async function updateSystemSettingsService(
  inputs: Array<{ key: string; value: unknown }>,
  actorId: string | null,
) {
  await ensureDefaultSystemSettings();
  const updates: Array<Promise<unknown>> = [];
  for (const item of inputs) {
    const def = SYSTEM_SETTING_DEF_BY_KEY.get(item.key as SystemSettingKey);
    if (!def) throw new HttpError(400, `Khoá cấu hình không hợp lệ: ${item.key}`);
    const value = validateValueByDef(def, item.value);
    updates.push(
      prisma.systemSetting.update({
        where: { key: def.key },
        data: { value: value as Prisma.InputJsonValue, updatedById: actorId },
      }),
    );
  }
  await Promise.all(updates);
  return listSystemSettingsService();
}

/** Đọc 1 setting đã ép kiểu, trả về `defaultValue` nếu chưa có/giá trị lỗi. */
export async function getSettingNumber(key: SystemSettingKey): Promise<number> {
  const def = SYSTEM_SETTING_DEF_BY_KEY.get(key);
  if (!def) throw new HttpError(500, `Khoá cấu hình không tồn tại: ${key}`);
  const fallback = typeof def.defaultValue === "number" ? def.defaultValue : 0;
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  const v = row.value;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export async function getSettingChannels(): Promise<string[]> {
  const row = await prisma.systemSetting.findUnique({ where: { key: "notification_channels" } });
  if (!row) return ["in_app"];
  const v = row.value;
  if (Array.isArray(v)) return v.map((x) => String(x));
  return ["in_app"];
}
