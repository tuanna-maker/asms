import { describe, expect, it } from "vitest";
import { buildSessionPayload, buildTraineePayload, buildTrainingCoursePayload } from "@/lib/training-payload";

describe("training payload helpers", () => {
  it("builds training course payload and omits empty optional fields", () => {
    const payload = buildTrainingCoursePayload({
      title: "Course",
      type: "internal",
      customerId: null,
      instructorId: null,
      startDate: "2026-01-01",
      endDate: "",
      participants: 3,
      status: "planned",
      description: "",
      location: "",
    });

    expect(payload).toMatchObject({
      title: "Course",
      typeCode: "internal",
      courseKind: "training",
      startDate: "2026-01-01",
      endDate: "2026-01-01",
      participants: 3,
      status: "planned",
    });
    expect("instructorId" in payload).toBe(false);
    expect("customerId" in payload).toBe(false);
    expect("location" in payload).toBe(false);
    expect("description" in payload).toBe(false);
  });

  it("sets coaching course kind when requested", () => {
    const payload = buildTrainingCoursePayload(
      {
        title: "HL",
        type: "internal",
        customerId: null,
        instructorId: null,
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        participants: 0,
        status: "planned",
      },
      "wf-coach",
      "coaching",
    );
    expect(payload.courseKind).toBe("coaching");
    expect(payload.workflowId).toBe("wf-coach");
  });

  it("includes stepPayloads when provided", () => {
    const stepPayloads = { "step-1": { note: "ghi chú" } };
    const payload = buildTrainingCoursePayload(
      {
        title: "Course",
        type: "internal",
        customerId: null,
        instructorId: null,
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        participants: 1,
        status: "planned",
      },
      "wf-1",
      "training",
      stepPayloads,
    );
    expect(payload.stepPayloads).toEqual(stepPayloads);
  });

  it("omits empty stepPayloads", () => {
    const payload = buildTrainingCoursePayload(
      {
        title: "Course",
        type: "internal",
        customerId: null,
        instructorId: null,
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        participants: 1,
        status: "planned",
      },
      "wf-1",
      "training",
      {},
    );
    expect("stepPayloads" in payload).toBe(false);
  });

  it("includes ids and location when set", () => {
    const payload = buildTrainingCoursePayload(
      {
        title: "Course",
        type: "external",
        customerId: "cust-1",
        instructorId: "user-1",
        startDate: "2026-01-01",
        endDate: "2026-01-05",
        participants: 5,
        status: "planned",
        location: "Học viện KTQS",
      },
      "wf-1",
    );
    expect(payload).toMatchObject({
      customerId: "cust-1",
      instructorId: "user-1",
      location: "Học viện KTQS",
      workflowId: "wf-1",
      courseKind: "training",
    });
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
