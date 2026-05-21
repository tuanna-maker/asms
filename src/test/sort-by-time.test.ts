import { describe, expect, it } from "vitest";
import { detectTimeSortKey, sortByNewestFirst } from "@/lib/sort-by-time";

describe("sort-by-time", () => {
  it("sortByNewestFirst sắp mới nhất trước theo createdAt", () => {
    const rows = [
      { id: "a", createdAt: "2024-01-01T00:00:00Z" },
      { id: "b", createdAt: "2026-05-01T00:00:00Z" },
      { id: "c", createdAt: "2025-06-01T00:00:00Z" },
    ];
    expect(sortByNewestFirst(rows).map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("detectTimeSortKey nhận diện createdAt", () => {
    expect(detectTimeSortKey({ createdAt: "2024-01-01", name: "x" })).toBe("createdAt");
  });
});
