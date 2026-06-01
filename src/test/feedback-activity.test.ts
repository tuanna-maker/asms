import { describe, expect, it } from "vitest";

import { mergeFeedbackActivity } from "@/lib/feedback-activity";

describe("mergeFeedbackActivity", () => {
  it("merges timeline and comments sorted newest first", () => {
    const items = mergeFeedbackActivity(
      [
        {
          id: "t1",
          event: "created",
          message: "Tạo",
          createdAt: "2026-05-01T10:00:00.000Z",
          actor: { id: "u1", fullName: "A" },
        },
      ],
      [
        {
          id: "c1",
          feedbackId: "f1",
          kind: "issue",
          body: "Hỏng nguồn",
          createdAt: "2026-05-02T10:00:00.000Z",
          author: { id: "u2", fullName: "B" },
        },
      ],
    );
    expect(items).toHaveLength(2);
    expect(items[0]?.type).toBe("comment");
    expect(items[0]?.type === "comment" && items[0].body).toBe("Hỏng nguồn");
    expect(items[1]?.type).toBe("system");
  });
});
