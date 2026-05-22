import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    contractClause: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";
import {
  buildTermsFromClauseItems,
  dedupeClauseItems,
  formatClauseBlock,
  joinClauseBlocks,
} from "./build-terms";

const mockedClauseFindMany = vi.mocked(prisma.contractClause.findMany);

describe("formatClauseBlock", () => {
  it("combines title and content", () => {
    expect(formatClauseBlock("Điều 1", "Nội dung A")).toBe("Điều 1\nNội dung A");
  });
});

describe("joinClauseBlocks", () => {
  it("joins with double newline", () => {
    expect(joinClauseBlocks(["A", "B"])).toBe("A\n\nB");
  });
});

describe("dedupeClauseItems", () => {
  it("keeps first occurrence and content", () => {
    expect(
      dedupeClauseItems([
        { clauseId: "c1", content: "x" },
        { clauseId: "c1", content: "y" },
        { clauseId: "c2", content: "z" },
      ]),
    ).toEqual([
      { clauseId: "c1", content: "x" },
      { clauseId: "c2", content: "z" },
    ]);
  });
});

describe("buildTermsFromClauseItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds terms from contract content and catalog titles", async () => {
    mockedClauseFindMany.mockResolvedValue([
      { id: "c1", title: "Tiêu đề 1" },
      { id: "c2", title: "Tiêu đề 2" },
    ] as never);

    const result = await buildTermsFromClauseItems([
      { clauseId: "c2", content: "Nội dung B" },
      { clauseId: "c1", content: "Nội dung A" },
    ]);

    expect(result.orderedIds).toEqual(["c2", "c1"]);
    expect(result.clauseItems).toEqual([
      { clauseId: "c2", content: "Nội dung B" },
      { clauseId: "c1", content: "Nội dung A" },
    ]);
    expect(result.terms).toBe("Tiêu đề 2\nNội dung B\n\nTiêu đề 1\nNội dung A");
  });

  it("returns empty when no items", async () => {
    const result = await buildTermsFromClauseItems([]);
    expect(result.orderedIds).toEqual([]);
    expect(result.terms).toBeNull();
    expect(mockedClauseFindMany).not.toHaveBeenCalled();
  });
});
