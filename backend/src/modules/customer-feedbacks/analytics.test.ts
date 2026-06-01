import { describe, expect, it } from "vitest";

import {
  _rowsFromFixtures,
  aggregateByCustomer,
  aggregateByMaterial,
  aggregateByProduct,
  aggregateFeedbackOverview,
} from "./analytics";

describe("feedback analytics aggregation", () => {
  const rows = _rowsFromFixtures([
    {
      id: "f1",
      customerId: "c1",
      status: "new",
      feedbackAt: "2026-03-01T10:00:00.000Z",
      slaDueAt: "2026-02-01T10:00:00.000Z",
      customer: { id: "c1", code: "KH01", name: "Khách A" },
      linkageItems: [
        { productId: "p1", productCode: "SP1", productName: "Sản phẩm 1", materialId: "m1", materialCode: "VT1", materialName: "Vật tư 1" },
      ],
    },
    {
      id: "f2",
      customerId: "c1",
      status: "resolved",
      feedbackAt: "2026-03-15T10:00:00.000Z",
      customer: { id: "c1", code: "KH01", name: "Khách A" },
      linkageItems: [
        { productId: "p1", productCode: "SP1", productName: "Sản phẩm 1", materialId: "m1", materialCode: "VT1", materialName: "Vật tư 1" },
        { productId: "p2", productCode: "SP2", productName: "Sản phẩm 2", materialId: null, materialCode: null, materialName: null },
      ],
    },
    {
      id: "f3",
      customerId: "c2",
      status: "in_progress",
      feedbackAt: "2026-04-01T10:00:00.000Z",
      customer: { id: "c2", code: "KH02", name: "Khách B" },
      linkageItems: [],
    },
  ]);

  it("aggregates overview counts", () => {
    const overview = aggregateFeedbackOverview(rows, new Date("2026-05-01T00:00:00.000Z"));
    expect(overview.total).toBe(3);
    expect(overview.withLinkage).toBe(2);
    expect(overview.overdue).toBe(1);
    expect(overview.byStatus.new).toBe(1);
    expect(overview.byStatus.resolved).toBe(1);
    expect(overview.monthly).toEqual([
      { month: "2026-03", count: 2 },
      { month: "2026-04", count: 1 },
    ]);
  });

  it("aggregates by customer", () => {
    const items = aggregateByCustomer(rows);
    expect(items[0].customerId).toBe("c1");
    expect(items[0].ticketCount).toBe(2);
    expect(items[0].linkageLineCount).toBe(3);
    expect(items[0].resolvedCount).toBe(1);
  });

  it("aggregates by product with all materials sorted by count", () => {
    const items = aggregateByProduct(rows);
    const p1 = items.find((i) => i.productId === "p1");
    expect(p1?.linkageLineCount).toBe(2);
    expect(p1?.ticketCount).toBe(2);
    expect(p1?.materials[0]?.materialId).toBe("m1");
    expect(p1?.materials[0]?.count).toBe(2);
  });

  it("aggregates by material", () => {
    const items = aggregateByMaterial(rows);
    expect(items).toHaveLength(1);
    expect(items[0].materialId).toBe("m1");
    expect(items[0].linkageLineCount).toBe(2);
    expect(items[0].ticketCount).toBe(2);
    expect(items[0].productCount).toBe(1);
    expect(items[0].customerCount).toBe(1);
  });
});
