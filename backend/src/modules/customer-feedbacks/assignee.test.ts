import { describe, expect, it } from "vitest";

import {
  buildAssigneeVisibilityFilter,
  buildFeedbackAccessFilter,
  canViewAllFeedbacks,
} from "./assignee";

describe("feedback assignee visibility", () => {
  it("only admin sees all", () => {
    expect(canViewAllFeedbacks("admin")).toBe(true);
    expect(canViewAllFeedbacks("manager")).toBe(false);
    expect(canViewAllFeedbacks("technician")).toBe(false);
  });

  it("builds OR filter for assignee user, role targets and legacy columns", () => {
    const filter = buildAssigneeVisibilityFilter({
      userId: "u1",
      roleCode: "technician",
    });
    expect(filter.OR).toEqual([
      { assigneeTargets: { some: { userId: "u1" } } },
      { assigneeType: "user", assignedUserId: "u1" },
      { assigneeTargets: { some: { roleCode: "technician" } } },
      { assigneeType: "role", assignedRoleCode: "technician" },
    ]);
  });

  it("access filter matches assignee visibility", async () => {
    const filter = await buildFeedbackAccessFilter({
      userId: "u1",
      roleCode: "technician",
    });
    expect(filter.OR).toHaveLength(4);
  });

  it("returns empty filter for admin", () => {
    expect(buildAssigneeVisibilityFilter({ userId: "u1", roleCode: "admin" })).toEqual({});
  });
});
