import { describe, expect, it } from "vitest";

import { canCommentOnFeedback } from "./comments";

describe("canCommentOnFeedback", () => {
  const base = {
    id: "f1",
    status: "in_progress",
    createdById: "creator",
    assigneeType: "user" as const,
    assignedUserId: "tech1",
    assignedRoleCode: null,
  };

  it("allows admin and manager", () => {
    expect(canCommentOnFeedback(base, { userId: "a", roleCode: "admin" })).toBe(true);
    expect(canCommentOnFeedback(base, { userId: "m", roleCode: "manager" })).toBe(true);
  });

  it("allows creator and assignee user", () => {
    expect(canCommentOnFeedback(base, { userId: "creator", roleCode: "sales" })).toBe(true);
    expect(canCommentOnFeedback(base, { userId: "tech1", roleCode: "technician" })).toBe(true);
  });

  it("allows assignee role match", () => {
    const roleFeedback = {
      ...base,
      assigneeType: "role",
      assignedUserId: null,
      assignedRoleCode: "technician",
    };
    expect(canCommentOnFeedback(roleFeedback, { userId: "t2", roleCode: "technician" })).toBe(true);
  });

  it("allows multi assignee via assignees field", () => {
    const multi = {
      ...base,
      assignees: { userIds: ["tech2"], roleCodes: ["technician"] },
    };
    expect(canCommentOnFeedback(multi, { userId: "tech2", roleCode: "sales" })).toBe(true);
    expect(canCommentOnFeedback(multi, { userId: "other", roleCode: "technician" })).toBe(true);
  });

  it("denies unrelated user", () => {
    expect(canCommentOnFeedback(base, { userId: "other", roleCode: "technician" })).toBe(false);
  });

  it("denies non-admin when resolved", () => {
    const resolved = { ...base, status: "resolved" };
    expect(canCommentOnFeedback(resolved, { userId: "tech1", roleCode: "technician" })).toBe(false);
    expect(canCommentOnFeedback(resolved, { userId: "admin", roleCode: "admin" })).toBe(true);
  });
});
