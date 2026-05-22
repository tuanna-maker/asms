import { describe, expect, it } from "vitest";
import { getPendingBomQuantityUpdates } from "@/components/products/ProductBomEditor";
import type { ProductBomLine } from "@/components/products/ProductBomEditor";

describe("getPendingBomQuantityUpdates", () => {
  const bom: ProductBomLine[] = [
    {
      materialId: "VT-001",
      materialName: "Linh kiện A",
      quantity: 2,
      unit: "cái",
    },
    {
      materialId: "VT-002",
      materialName: "Linh kiện B",
      quantity: 5,
      unit: "bộ",
    },
  ];

  it("returns only changed quantities", () => {
    const updates = getPendingBomQuantityUpdates(bom, {
      "VT-001": "2",
      "VT-002": "8",
    });
    expect(updates).toEqual([{ materialId: "VT-002", quantity: 8 }]);
  });

  it("returns empty when nothing changed", () => {
    expect(getPendingBomQuantityUpdates(bom, { "VT-001": "2", "VT-002": "5" })).toEqual([]);
  });
});
