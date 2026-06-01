import { describe, expect, it } from "vitest";
import { buildLinkagePayload, resolveFeedbackContractId } from "@/lib/customer-feedback-linkage";

describe("resolveFeedbackContractId", () => {
  const products = [
    { id: "p1", contractIds: ["c1", "c2"] },
    { id: "p2", contractIds: ["c2"] },
  ];
  const materials = [{ id: "m1", contractIds: ["c1"], productIds: ["p1"] }];

  it("returns explicit contract when set", () => {
    expect(resolveFeedbackContractId("c1", ["p2"], [], products, materials)).toBe("c1");
  });

  it("derives contract from single product selection", () => {
    expect(resolveFeedbackContractId(null, ["p2"], [], products, materials)).toBe("c2");
  });

  it("returns null when products span contracts", () => {
    const disjoint = [
      { id: "pa", contractIds: ["c1"] },
      { id: "pb", contractIds: ["c2"] },
    ];
    expect(resolveFeedbackContractId(null, ["pa", "pb"], [], disjoint, [])).toBeNull();
  });

  it("does not throw when material id missing from meta list", () => {
    expect(
      resolveFeedbackContractId(null, ["p2"], ["m-missing"], products, materials),
    ).toBe("c2");
  });
});

describe("buildLinkagePayload", () => {
  it("includes product from selected material without ticking product", () => {
    const payload = buildLinkagePayload([], ["m1"], [
      { id: "m1", contractIds: ["c1"], productIds: ["p1"] },
    ]);
    expect(payload).toEqual([{ productId: "p1", materialId: "m1" }]);
  });

  it("accepts legacy productId on material meta", () => {
    const payload = buildLinkagePayload([], ["m1"], [
      { id: "m1", contractIds: ["c1"], productId: "p1" },
    ]);
    expect(payload).toEqual([{ productId: "p1", materialId: "m1" }]);
  });
});
