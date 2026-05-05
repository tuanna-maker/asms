import { describe, expect, it } from "vitest";
import { qk } from "@/lib/query-keys";

describe("query keys", () => {
  it("should generate stable list keys", () => {
    expect(qk.customers.all).toEqual(["customers"]);
    expect(qk.training.all).toEqual(["training-courses"]);
  });

  it("should generate detail keys with id", () => {
    expect(qk.contracts.detail("abc")).toEqual(["contracts", "abc"]);
    expect(qk.tasks.detail("task-1")).toEqual(["tasks", "task-1"]);
  });

  it("should generate contacts list keys", () => {
    expect(qk.contacts.list()).toEqual(["contacts", "list", "all"]);
    expect(qk.contacts.list("KH-001")).toEqual(["contacts", "list", "KH-001"]);
  });

  it("should generate crm activities list keys", () => {
    expect(qk.crmActivities.list()).toEqual(["crm-activities", "list", "all"]);
  });

  it("should generate research project keys", () => {
    expect(qk.researchProjects.all).toEqual(["research-projects"]);
    expect(qk.researchProjects.detail("NCKH-1")).toEqual(["research-projects", "NCKH-1"]);
  });

  it("should generate handover keys", () => {
    expect(qk.handovers.all).toEqual(["handovers"]);
    expect(qk.handovers.detail("BG-1")).toEqual(["handovers", "BG-1"]);
  });

  it("should generate user keys", () => {
    expect(qk.users.all).toEqual(["users"]);
    expect(qk.users.detail("u1")).toEqual(["users", "u1"]);
  });

  it("should generate material transfer keys", () => {
    expect(qk.materials.all).toEqual(["materials"]);
    expect(qk.materials.transfers).toEqual(["materials", "transfers"]);
  });

  it("should generate definition list keys by category and scope", () => {
    expect(qk.definitions.all).toEqual(["definitions"]);
    expect(qk.definitions.list("warehouse", "active")).toEqual(["definitions", "warehouse", "active"]);
    expect(qk.definitions.list("material_unit", "all")).toEqual(["definitions", "material_unit", "all"]);
  });
});
