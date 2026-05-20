import { describe, expect, it } from "vitest";
import { isValidDefinitionCode } from "@/lib/attribute-code-validation";

describe("attribute-code-validation", () => {
  it("accepts latin codes for standard categories", () => {
    expect(isValidDefinitionCode("contract_type", "maintenance")).toBe(true);
    expect(isValidDefinitionCode("warranty_status", "open")).toBe(true);
  });

  it("rejects invalid latin codes", () => {
    expect(isValidDefinitionCode("contract_type", "bad code")).toBe(false);
    expect(isValidDefinitionCode("contract_type", "")).toBe(false);
  });

  it("allows vietnamese warehouse and unit codes", () => {
    expect(isValidDefinitionCode("warehouse", "Kho chính")).toBe(true);
    expect(isValidDefinitionCode("material_unit", "cái")).toBe(true);
  });
});
