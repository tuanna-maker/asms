import { describe, expect, it } from "vitest";

import {
  buildAssigneeVisibilityFilter,
  buildFeedbackAccessFilter,
  canViewAllFeedbacks,
} from "./assignee";

describe("feedback assignee visibility", () => {
  it("admin and manager see all", () => {
    expect(canViewAllFeedbacks("admin")).toBe(true);
    expect(canViewAllFeedbacks("manager")).toBe(true);
    expect(canViewAllFeedbacks("technician")).toBe(false);
  });

  it("builds OR filter for user, creator and role", () => {
    const filter = buildAssigneeVisibilityFilter({
      userId: "u1",
      roleCode: "technician",
    });
    expect(filter.OR).toEqual([
      { assigneeType: "user", assignedUserId: "u1" },
      { createdById: "u1" },
      { assigneeType: "role", assignedRoleCode: "technician" },
    ]);
  });

  it("access filter adds unit assignments", async () => {
    const filter = await buildFeedbackAccessFilter({
      userId: "u1",
      roleCode: "technician",
    });
    expect(filter.OR?.length).toBeGreaterThanOrEqual(3);
  });

  it("returns empty filter for admin", () => {
    expect(buildAssigneeVisibilityFilter({ userId: "u1", roleCode: "admin" })).toEqual({});
  });
});
