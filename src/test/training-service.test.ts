import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    trainingCourse: { findFirst: vi.fn() },
    trainee: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    scheduleSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../../backend/src/utils/prisma", () => ({
  prisma: prismaMock,
}));

import {
  addScheduleSessionService,
  addTraineeService,
  softDeleteScheduleSessionService,
  softDeleteTraineeService,
  updateScheduleSessionService,
  updateTraineeService,
} from "../../backend/src/modules/training/service";
import { HttpError } from "../../backend/src/lib/errors/HttpError";

describe("training service sub-resource CRUD", () => {
  it("creates trainee and session when course exists", async () => {
    prismaMock.trainingCourse.findFirst.mockResolvedValue({ id: "tc-1" });
    prismaMock.trainee.create.mockResolvedValue({ id: "tr-1" });
    prismaMock.scheduleSession.create.mockResolvedValue({ id: "ss-1" });

    const trainee = await addTraineeService("tc-1", {
      fullName: "Nguyen A",
      attendance: "present",
      unit: "Unit 1",
    });
    const session = await addScheduleSessionService("tc-1", {
      date: new Date("2026-01-01T08:00:00.000Z"),
      startTime: "08:00",
      endTime: "10:00",
      topic: "Topic",
      status: "planned",
    });

    expect(trainee).toMatchObject({ id: "tr-1" });
    expect(session).toMatchObject({ id: "ss-1" });
    expect(prismaMock.trainee.create).toHaveBeenCalledOnce();
    expect(prismaMock.scheduleSession.create).toHaveBeenCalledOnce();
  });

  it("updates and soft-deletes trainee/session and throws on missing rows", async () => {
    prismaMock.trainee.findFirst.mockResolvedValue({ id: "tr-1" });
    prismaMock.trainee.update.mockResolvedValue({ id: "tr-1", attendance: "absent" });
    prismaMock.trainee.updateMany.mockResolvedValue({ count: 1 });

    prismaMock.scheduleSession.findFirst.mockResolvedValue({ id: "ss-1" });
    prismaMock.scheduleSession.update.mockResolvedValue({ id: "ss-1", status: "done" });
    prismaMock.scheduleSession.updateMany.mockResolvedValue({ count: 1 });

    const tr = await updateTraineeService("tc-1", "tr-1", { attendance: "absent" });
    const ss = await updateScheduleSessionService("tc-1", "ss-1", { status: "done" });
    const delTr = await softDeleteTraineeService("tc-1", "tr-1");
    const delSs = await softDeleteScheduleSessionService("tc-1", "ss-1");

    expect(tr).toMatchObject({ id: "tr-1" });
    expect(ss).toMatchObject({ id: "ss-1" });
    expect(delTr).toEqual({ id: "tr-1" });
    expect(delSs).toEqual({ id: "ss-1" });

    prismaMock.trainee.findFirst.mockResolvedValueOnce(null);
    await expect(updateTraineeService("tc-1", "missing", { attendance: "present" })).rejects.toBeInstanceOf(HttpError);

    prismaMock.scheduleSession.findFirst.mockResolvedValueOnce(null);
    await expect(updateScheduleSessionService("tc-1", "missing", { status: "done" })).rejects.toBeInstanceOf(HttpError);
  });
});
