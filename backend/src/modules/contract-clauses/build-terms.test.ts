import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    contractClause: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";
import { buildTermsFromClauseIds, joinClauseContents } from "./build-terms";

const mockedClauseFindMany = vi.mocked(prisma.contractClause.findMany);

describe("joinClauseContents", () => {
  it("joins with double newline", () => {
    expect(joinClauseContents(["A", "B"])).toBe("A\n\nB");
  });

  it("returns null for empty", () => {
    expect(joinClauseContents([])).toBeNull();
  });
});

describe("buildTermsFromClauseIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves client order for terms snapshot", async () => {
    mockedClauseFindMany.mockResolvedValue([
      { id: "c1", content: "A" },
      { id: "c2", content: "B" },
    ] as never);

    const result = await buildTermsFromClauseIds(["c2", "c1"]);
    expect(result.orderedIds).toEqual(["c2", "c1"]);
    expect(result.terms).toBe("B\n\nA");
    expect(mockedClauseFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: { in: ["c2", "c1"] } }),
      }),
    );
  });

  it("dedupes while keeping first occurrence", async () => {
    mockedClauseFindMany.mockResolvedValue([{ id: "c1", content: "A" }] as never);

    const result = await buildTermsFromClauseIds(["c1", "c1", "c1"]);
    expect(result.orderedIds).toEqual(["c1"]);
    expect(result.terms).toBe("A");
  });

  it("returns empty when no ids", async () => {
    const result = await buildTermsFromClauseIds([]);
    expect(result.orderedIds).toEqual([]);
    expect(result.terms).toBeNull();
    expect(mockedClauseFindMany).not.toHaveBeenCalled();
  });
});
