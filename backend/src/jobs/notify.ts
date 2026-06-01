/**
 * Scheduler thông báo in-app:
 *  - SLA HĐ thực hiện: quét mỗi N phút (mặc định 60).
 *  - Nhắc lịch (HĐ hết hạn, vật tư, …): 1 lần/ngày theo notification_daily_run_hour.
 */
import { prisma } from "../utils/prisma";
import { runContractExecutionSlaScan } from "../modules/contracts/execution-sla";
import { scanFeedbackSlaOverdue } from "../modules/customer-feedbacks/feedback-sla-scan";
import { getSettingNumber } from "../modules/system-settings/service";
import { createNotificationForUser, notifyByPreference } from "../modules/notifications/service";
import { resolveContractDisplayStatus } from "../modules/contracts/display-status";

const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_CHECK_MS = 15 * 60 * 1000;

let cronStarted = false;
let lastDailyRunDateKey = "";

function todayDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function startNotificationCron() {
  if (cronStarted) return;
  cronStarted = true;

  const runSlaLoop = async () => {
    try {
      const intervalMin = await getSettingNumber("notification_sla_scan_interval_minutes");
      await runContractExecutionSlaScan();
      await scanFeedbackSlaOverdue().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[notify] feedback SLA scan failed", err);
      });
      return Math.max(5, intervalMin) * 60 * 1000;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[notify] SLA scan failed", e);
      return 60 * 60 * 1000;
    }
  };

  const scheduleSla = (delayMs: number) => {
    setTimeout(() => {
      void runSlaLoop().then((nextMs) => scheduleSla(nextMs));
    }, delayMs);
  };

  setTimeout(() => {
    void runSlaLoop().then((nextMs) => scheduleSla(nextMs));
  }, 60 * 1000);

  const tickDaily = async () => {
    try {
      const now = new Date();
      const runHour = await getSettingNumber("notification_daily_run_hour");
      const hour = now.getHours();
      const todayKey = todayDateKey(now);
      if (hour === runHour && lastDailyRunDateKey !== todayKey) {
        lastDailyRunDateKey = todayKey;
        await runDailyNotificationScan();
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[notify] daily scan failed", e);
    }
  };

  setTimeout(() => void tickDaily(), 90 * 1000);
  setInterval(() => void tickDaily(), DAILY_CHECK_MS);
}

/** Quét nhắc lịch (không gồm SLA thực hiện HĐ — đã tách cron riêng). */
export async function runDailyNotificationScan() {
  const now = new Date();

  const [
    contractDaysDefault,
    materialThreshold,
    taskGraceHours,
    warrantyDays,
    trainingDays,
    repairDays,
    contractHighThreshold,
    contractRemindDaysHigh,
    contractRemindDaysLow,
  ] = await Promise.all([
    getSettingNumber("contract_expiry_remind_days"),
    getSettingNumber("material_low_threshold_percent"),
    getSettingNumber("task_late_grace_hours"),
    getSettingNumber("warranty_expiry_remind_days"),
    getSettingNumber("training_upcoming_remind_days"),
    getSettingNumber("repair_scheduled_remind_days"),
    getSettingNumber("contract_value_high_threshold"),
    getSettingNumber("contract_remind_days_high"),
    getSettingNumber("contract_remind_days_low"),
  ]);

  await scanContractExpiry(now, {
    fallbackDays: contractDaysDefault,
    highThreshold: contractHighThreshold,
    daysHigh: contractRemindDaysHigh,
    daysLow: contractRemindDaysLow,
  });
  await scanMaterialLow(materialThreshold);
  await scanTaskLate(now, taskGraceHours);
  await scanWarrantyExpiry(now, warrantyDays);
  await scanTrainingUpcoming(now, trainingDays);
  await scanRepairScheduled(now, repairDays);
  await scanCustomerAnniversaries(now);
}

/** @deprecated Dùng runDailyNotificationScan; giữ alias cho script/dev. */
export async function runNotificationScan() {
  await runDailyNotificationScan();
}

async function scanContractExpiry(
  now: Date,
  cfg: { fallbackDays: number; highThreshold: number; daysHigh: number; daysLow: number },
) {
  const horizon = Math.max(cfg.daysHigh, cfg.daysLow, cfg.fallbackDays);
  const horizonDate = new Date(now.getTime() + horizon * DAY_MS);
  const contracts = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["completed", "liquidated"] },
      endDate: { gte: now, lte: horizonDate },
    },
    select: {
      id: true,
      code: true,
      title: true,
      startDate: true,
      endDate: true,
      value: true,
      status: true,
      endReminderDays: true,
    },
  });
  for (const c of contracts) {
    const displayStatus = resolveContractDisplayStatus({
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
      now,
    });
    if (displayStatus !== "draft" && displayStatus !== "active") continue;

    const valueNumber = Number(c.value ?? 0);
    const isHigh = valueNumber >= cfg.highThreshold;
    const remindDays =
      c.endReminderDays > 0
        ? c.endReminderDays
        : isHigh
          ? cfg.daysHigh
          : cfg.daysLow || cfg.fallbackDays;
    const remindBefore = new Date(now.getTime() + remindDays * DAY_MS);
    if (c.endDate.getTime() > remindBefore.getTime()) continue;
    const daysLeft = Math.max(0, Math.ceil((c.endDate.getTime() - now.getTime()) / DAY_MS));
    await notifyByPreference({
      key: "contract_expiry",
      title: `Hợp đồng ${c.code} sắp hết hạn`,
      message: `${c.title} — còn ${daysLeft} ngày${isHigh ? " (HĐ giá trị cao)" : ""}.`,
      link: `/hop-dong`,
      refType: "contract",
      refId: c.id,
    });
  }
}

async function scanMaterialLow(thresholdPercent: number) {
  const materials = await prisma.material.findMany({
    where: { deletedAt: null, quantity: { gt: 0 } },
    select: { id: true, code: true, name: true, available: true, quantity: true },
  });
  for (const m of materials) {
    const ratio = (m.available / Math.max(1, m.quantity)) * 100;
    if (ratio <= thresholdPercent) {
      await notifyByPreference({
        key: "material_low",
        title: `Vật tư ${m.code} sắp hết`,
        message: `${m.name} — còn ${m.available}/${m.quantity}.`,
        link: `/vat-tu`,
        refType: "material",
        refId: m.id,
      });
    }
  }
}

async function scanTaskLate(now: Date, graceHours: number) {
  const cutoff = new Date(now.getTime() - graceHours * 60 * 60 * 1000);
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      status: { notIn: ["completed"] },
      deadline: { lte: cutoff },
    },
    select: { id: true, code: true, title: true, deadline: true, assigneeId: true },
  });
  for (const t of tasks) {
    if (!t.assigneeId) continue;
    await createNotificationForUser({
      userId: t.assigneeId,
      key: "task_late",
      title: `Nhiệm vụ ${t.code} trễ tiến độ`,
      message: t.title,
      link: `/cong-viec`,
      refType: "task",
      refId: t.id,
    });
  }
}

async function scanWarrantyExpiry(now: Date, days: number) {
  const remindBefore = new Date(now.getTime() + days * DAY_MS);
  const contracts = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      warrantyEnd: { not: null, gte: now, lte: remindBefore },
    },
    select: { id: true, code: true, title: true, warrantyEnd: true },
  });
  for (const c of contracts) {
    if (!c.warrantyEnd) continue;
    const daysLeft = Math.max(0, Math.ceil((c.warrantyEnd.getTime() - now.getTime()) / DAY_MS));
    await notifyByPreference({
      key: "warranty_expiry",
      title: `Bảo hành ${c.code} sắp hết hạn`,
      message: `${c.title} — còn ${daysLeft} ngày bảo hành.`,
      link: `/bao-hanh`,
      refType: "contract",
      refId: c.id,
    });
  }
}

async function scanTrainingUpcoming(now: Date, days: number) {
  const remindBefore = new Date(now.getTime() + days * DAY_MS);
  const courses = await prisma.trainingCourse.findMany({
    where: {
      deletedAt: null,
      status: "planned",
      startDate: { gte: now, lte: remindBefore },
    },
    select: { id: true, code: true, title: true, startDate: true },
  });
  for (const t of courses) {
    const daysLeft = Math.max(0, Math.ceil((t.startDate.getTime() - now.getTime()) / DAY_MS));
    await notifyByPreference({
      key: "training_upcoming",
      title: `Khoá đào tạo ${t.code} sắp bắt đầu`,
      message: `${t.title} — bắt đầu trong ${daysLeft} ngày.`,
      link: `/dao-tao`,
      refType: "training_course",
      refId: t.id,
    });
  }
}

async function scanCustomerAnniversaries(now: Date) {
  const items = await prisma.customerAnniversary.findMany({
    select: {
      id: true,
      customerId: true,
      label: true,
      occursAt: true,
      recurringYearly: true,
      reminderDays: true,
      customer: { select: { code: true, name: true } },
      subscriptions: { select: { userId: true } },
    },
  });
  for (const item of items) {
    const occ = new Date(item.occursAt);
    if (item.recurringYearly) {
      occ.setFullYear(now.getFullYear());
      if (occ.getTime() < now.getTime()) {
        occ.setFullYear(now.getFullYear() + 1);
      }
    }
    const diffDays = Math.ceil((occ.getTime() - now.getTime()) / DAY_MS);
    if (diffDays < 0 || diffDays > item.reminderDays) continue;

    const title = `Kỷ niệm: ${item.label}`;
    const message = `${item.customer.name} (${item.customer.code}) — còn ${diffDays} ngày.`;
    const link = `/khach-hang`;

    await notifyByPreference({
      key: "customer_anniversary",
      title,
      message,
      link,
      refType: "customer",
      refId: item.customerId,
    });

    for (const sub of item.subscriptions) {
      await createNotificationForUser({
        userId: sub.userId,
        key: "anniversary_reminder",
        title,
        message,
        link,
        refType: "anniversary",
        refId: item.id,
      });
    }
  }
}

async function scanRepairScheduled(now: Date, days: number) {
  const remindBefore = new Date(now.getTime() + days * DAY_MS);
  const warranties = await prisma.warranty.findMany({
    where: {
      deletedAt: null,
      statusCode: { in: ["open", "processing"] },
      slaHours: { not: null },
    },
    select: { id: true, code: true, issue: true, slaHours: true, createdAt: true },
  });
  for (const w of warranties) {
    if (w.slaHours == null) continue;
    const due = new Date(w.createdAt.getTime() + w.slaHours * 60 * 60 * 1000);
    if (due.getTime() > remindBefore.getTime() || due.getTime() < now.getTime()) continue;
    const daysLeft = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / DAY_MS));
    await notifyByPreference({
      key: "repair_scheduled",
      title: `Phiếu bảo hành ${w.code} sắp đến hạn`,
      message: `${w.issue} — còn ${daysLeft} ngày.`,
      link: `/bao-hanh`,
      refType: "warranty",
      refId: w.id,
    });
  }
}
