import { describe, expect, it } from "vitest";
import { buildSessionPayload, buildTraineePayload, buildTrainingCoursePayload } from "@/lib/training-payload";

describe("training payload helpers", () => {
  it("builds training course payload and omits empty optional fields", () => {
    const payload = buildTrainingCoursePayload({
      title: "Course",
      type: "internal",
      instructor: "",
      customer: "",
      startDate: "2026-01-01",
      endDate: "",
      participants: 3,
      status: "planned",
      description: "",
      location: "",
    });

    expect(payload).toMatchObject({
      title: "Course",
      type: "internal",
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      participants: 3,
      status: "planned",
    });
    expect("instructorId" in payload).toBe(true);
    expect(payload.instructorId).toBeUndefined();
    expect("location" in payload).toBe(false);
    expect("description" in payload).toBe(false);
  });

  it("builds trainee and session payload with normalized optionals", () => {
    const traineePayload = buildTraineePayload({
      name: "Nguyen Van A",
      unit: "Unit 1",
      rank: "",
      attendance: "present",
      score: undefined,
    });
    expect(traineePayload).toMatchObject({
      fullName: "Nguyen Van A",
      unit: "Unit 1",
      attendance: "present",
    });
    expect(traineePayload.rank).toBeUndefined();
    expect("score" in traineePayload).toBe(false);

    const sessionPayload = buildSessionPayload({
      date: "2026-02-01",
      startTime: "08:00",
      endTime: "10:00",
      topic: "Session 1",
      location: "",
      status: "planned",
    });
    expect(sessionPayload).toMatchObject({
      date: "2026-02-01",
      startTime: "08:00",
      endTime: "10:00",
      topic: "Session 1",
      status: "planned",
    });
    expect(sessionPayload.location).toBeUndefined();
  });
});
