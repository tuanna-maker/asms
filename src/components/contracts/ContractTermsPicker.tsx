import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useContractClauseGroupsList,
  useContractClausesList,
} from "@/hooks/use-contract-clauses-api";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

function groupCheckState(groupClauseIds: string[], selected: Set<string>) {
  if (groupClauseIds.length === 0) return { checked: false, indeterminate: false };
  const picked = groupClauseIds.filter((id) => selected.has(id)).length;
  if (picked === 0) return { checked: false, indeterminate: false };
  if (picked === groupClauseIds.length) return { checked: true, indeterminate: false };
  return { checked: false, indeterminate: true };
}

export function ContractTermsPicker({ value, onChange, disabled }: Props) {
  const { data: groups = [], isLoading: groupsLoading } = useContractClauseGroupsList();
  const { data: clauses = [], isLoading: clausesLoading } = useContractClausesList();

  const selected = useMemo(() => new Set(value), [value]);

  const clauseById = useMemo(() => new Map(clauses.map((c) => [c.id, c])), [clauses]);

  const groupedClauseIds = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) {
      for (const m of g.members) {
        if (m.clause?.isActive !== false) set.add(m.clauseId);
      }
    }
    return set;
  }, [groups]);

  const orphanClauses = useMemo(
    () =>
      [...clauses]
        .filter((c) => c.isActive && !groupedClauseIds.has(c.id))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [clauses, groupedClauseIds],
  );

  const sortedGroups = useMemo(
    () =>
      [...groups]
        .filter((g) => g.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [groups],
  );

  const toggleClause = (clauseId: string, checked: boolean) => {
    if (disabled) return;
    const next = new Set(value);
    if (checked) next.add(clauseId);
    else next.delete(clauseId);
    onChange([...next]);
  };

  const toggleGroup = (clauseIds: string[], checked: boolean) => {
    if (disabled) return;
    const next = new Set(value);
    for (const id of clauseIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onChange([...next]);
  };

  const previewText = useMemo(() => {
    const parts: string[] = [];
    const addIfSelected = (id: string) => {
      if (!selected.has(id)) return;
      const c = clauseById.get(id);
      if (c?.content?.trim()) parts.push(c.content.trim());
    };
    for (const g of sortedGroups) {
      const ids = g.members
        .filter((m) => m.clause?.isActive !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => m.clauseId);
      for (const id of ids) addIfSelected(id);
    }
    for (const c of orphanClauses) addIfSelected(c.id);
    return parts.join("\n\n");
  }, [selected, sortedGroups, orphanClauses, clauseById]);

  if (groupsLoading || clausesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh mục điều khoản…
      </div>
    );
  }

  if (sortedGroups.length === 0 && orphanClauses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Chưa có điều khoản mẫu. Thêm tại Cài đặt → Thuộc tính → Hợp đồng.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map((group) => {
        const memberIds = group.members
          .filter((m) => m.clause?.isActive !== false)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((m) => m.clauseId);
        const state = groupCheckState(memberIds, selected);
        return (
          <div key={group.id} className="rounded-lg border border-border/60 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`grp-${group.id}`}
                disabled={disabled || memberIds.length === 0}
                checked={state.indeterminate ? "indeterminate" : state.checked}
                onCheckedChange={(v) => toggleGroup(memberIds, v === true)}
              />
              <Label htmlFor={`grp-${group.id}`} className="font-semibold cursor-pointer">
                {group.label}
              </Label>
            </div>
            <div className="pl-6 space-y-2">
              {memberIds.map((clauseId) => {
                const c = clauseById.get(clauseId) ?? group.members.find((m) => m.clauseId === clauseId)?.clause;
                if (!c) return null;
                return (
                  <label key={clauseId} className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      disabled={disabled}
                      checked={selected.has(clauseId)}
                      onCheckedChange={(v) => toggleClause(clauseId, v === true)}
                    />
                    <span className="text-sm leading-snug">
                      <span className="font-medium">{c.title}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {orphanClauses.length > 0 ? (
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <p className="text-sm font-semibold">Khác / không thuộc nhóm</p>
          <div className="space-y-2">
            {orphanClauses.map((c) => (
              <label key={c.id} className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  disabled={disabled}
                  checked={selected.has(c.id)}
                  onCheckedChange={(v) => toggleClause(c.id, v === true)}
                />
                <span className="text-sm font-medium">{c.title}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {previewText ? (
        <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Xem trước nội dung đã chọn</p>
          <p className="text-sm whitespace-pre-wrap text-card-foreground">{previewText}</p>
        </div>
      ) : null}
    </div>
  );
}
