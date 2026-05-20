import { describe, expect, it } from "vitest";
import { initTrainingStepPayloads, trainingStepTabLabel } from "@/lib/training-step-payload";

describe("training-step-payload", () => {
  it("builds tab label from order and name", () => {
    expect(trainingStepTabLabel(10, "Chuẩn bị tài liệu")).toBe("1 · Chuẩn bị tài liệu");
    expect(trainingStepTabLabel(20, "A very long step name that exceeds limit")).toMatch(/^2 · A very long step name/);
  });

  it("initializes payloads from field schema", () => {
    const payloads = initTrainingStepPayloads(
      [
        {
          id: "s1",
          fieldSchema: [{ key: "note", label: "Ghi chú", type: "text" }],
        },
      ],
      { s1: { note: "existing" } },
    );
    expect(payloads.s1).toEqual({ note: "existing" });
  });
});
