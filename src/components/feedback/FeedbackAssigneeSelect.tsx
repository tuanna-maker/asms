import { UserMultiSelect } from "@/components/workflow/UserMultiSelect";
import { RoleMultiSelect } from "@/components/common/RoleMultiSelect";
import type { CustomerFeedbackRow, FeedbackAssignees } from "@/hooks/use-customer-feedbacks-api";

type Props = {
  value: FeedbackAssignees;
  onChange: (value: FeedbackAssignees) => void;
  disabled?: boolean;
  compact?: boolean;
};

export function FeedbackAssigneeSelect({ value, onChange, disabled, compact }: Props) {
  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "rounded-lg border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-4"
      }
    >
      {!compact ? (
        <div>
          <p className="text-sm font-medium text-foreground">Phân công *</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chọn một hoặc nhiều người và/hoặc vai trò được giao xử lý phản ánh.
          </p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        <UserMultiSelect
          value={value.userIds}
          onChange={(userIds) => onChange({ ...value, userIds })}
          disabled={disabled}
          label="Người được phân công"
          hint=""
          addButtonLabel="Thêm người…"
        />
        <RoleMultiSelect
          value={value.roleCodes}
          onChange={(roleCodes) => onChange({ ...value, roleCodes })}
          disabled={disabled}
          label="Vai trò được phân công"
          addButtonLabel="Thêm vai trò…"
        />
      </div>
    </div>
  );
}

export function emptyAssignees(): FeedbackAssignees {
  return { userIds: [], roleCodes: [] };
}

export function isAssigneeComplete(assignees: FeedbackAssignees): boolean {
  return assignees.userIds.length > 0 || assignees.roleCodes.length > 0;
}

export function rowToAssignees(row: Pick<
  CustomerFeedbackRow,
  "assignees" | "assigneeType" | "assignedUserId" | "assignedRoleCode"
>): FeedbackAssignees {
  if (row.assignees) {
    return { userIds: [...row.assignees.userIds], roleCodes: [...row.assignees.roleCodes] };
  }
  if (row.assigneeType === "role" && row.assignedRoleCode) {
    return { userIds: [], roleCodes: [row.assignedRoleCode] };
  }
  if (row.assignedUserId) {
    return { userIds: [row.assignedUserId], roleCodes: [] };
  }
  return emptyAssignees();
}
