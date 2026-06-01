import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserSearchSelect } from "@/components/common/UserSearchSelect";
import { useRolesList } from "@/hooks/use-roles-api";
import type { FeedbackAssignee } from "@/hooks/use-customer-feedbacks-api";

type Props = {
  value: FeedbackAssignee;
  onChange: (value: FeedbackAssignee) => void;
  disabled?: boolean;
  userDisplayName?: string;
};

export function FeedbackAssigneeSelect({
  value,
  onChange,
  disabled,
  userDisplayName,
}: Props) {
  const [mode, setMode] = useState<"user" | "role">(value.type);
  const { data: roles = [] } = useRolesList(true);
  const activeRoles = roles.filter((r) => r.isActive);

  useEffect(() => {
    setMode(value.type);
  }, [value.type]);

  const onModeChange = (next: "user" | "role") => {
    setMode(next);
    onChange({ type: next, userId: null, roleCode: null });
  };

  return (
    <div className="space-y-2">
      <Label>Phân công *</Label>
      <Select value={mode} onValueChange={(v) => onModeChange(v as "user" | "role")} disabled={disabled}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">Người cụ thể</SelectItem>
          <SelectItem value="role">Theo vai trò</SelectItem>
        </SelectContent>
      </Select>
      {mode === "user" ? (
        <UserSearchSelect
          value={value.userId ?? null}
          onChange={(id) => onChange({ type: "user", userId: id, roleCode: null })}
          disabled={disabled}
          placeholder="Chọn người xử lý…"
          displayName={userDisplayName}
        />
      ) : (
        <Select
          value={value.roleCode ?? ""}
          onValueChange={(code) => onChange({ type: "role", userId: null, roleCode: code })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn vai trò…" />
          </SelectTrigger>
          <SelectContent>
            {activeRoles.map((r) => (
              <SelectItem key={r.id} value={r.code}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function isAssigneeComplete(assignee: FeedbackAssignee): boolean {
  if (assignee.type === "user") return Boolean(assignee.userId?.trim());
  return Boolean(assignee.roleCode?.trim());
}

export function rowToAssignee(row: {
  assigneeType?: string | null;
  assignedUserId?: string | null;
  assignedRoleCode?: string | null;
}): FeedbackAssignee {
  if (row.assigneeType === "role" && row.assignedRoleCode) {
    return { type: "role", userId: null, roleCode: row.assignedRoleCode };
  }
  return { type: "user", userId: row.assignedUserId ?? null, roleCode: null };
}
