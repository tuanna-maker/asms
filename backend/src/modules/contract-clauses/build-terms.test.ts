import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    contractClauseGroup: { findMany: vi.fn() },
    contractClause: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";
import { buildTermsFromClauseIds, joinClauseContents } from "./build-terms";

const mockedGroupFindMany = vi.mocked(prisma.contractClauseGroup.findMany);
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

  it("orders by group then orphans", async () => {
    mockedGroupFindMany.mockResolvedValue([
      {
        id: "g1",
        sortOrder: 0,
        members: [
          {
            sortOrder: 0,
            clause: { id: "c2", content: "B", deletedAt: null, isActive: true },
          },
        ],
      },
    ] as never);
    mockedClauseFindMany.mockResolvedValue([
      { id: "c1", content: "A", sortOrder: 0 },
      { id: "c2", content: "B", sortOrder: 1 },
    ] as never);

    const result = await buildTermsFromClauseIds(["c1", "c2"]);
    expect(result.orderedIds).toEqual(["c2", "c1"]);
    expect(result.terms).toBe("B\n\nA");
  });

  it("returns empty when no ids", async () => {
    const result = await buildTermsFromClauseIds([]);
    expect(result.orderedIds).toEqual([]);
    expect(result.terms).toBeNull();
    expect(mockedGroupFindMany).not.toHaveBeenCalled();
  });
});
