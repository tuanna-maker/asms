import { describe, expect, it } from "vitest";
import { enrichAndValidateLinkageItems } from "./linkage-items";

describe("enrichAndValidateLinkageItems", () => {
  it("requires contract when linkage inputs are provided", async () => {
    await expect(
      enrichAndValidateLinkageItems("cust1", null, [{ productId: "p1" }]),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
