import { Fragment, useEffect, useMemo, useState } from "react";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useContractClauseGroupsList,
  useContractClausesList,
  type ContractClauseItem,
} from "@/hooks/use-contract-clauses-api";
import { cn } from "@/lib/utils";
import { clausePickerStyles } from "@/components/settings/attributes/contract-clause-styles";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

type ClauseTableRow = {
  id: string;
  title: string;
  content: string;
  groupLabel: string;
};

function orderSelection(
  currentValue: string[],
  nextSelected: Set<string>,
  catalogOrder: string[],
): string[] {
  const kept = currentValue.filter((id) => nextSelected.has(id));
  const keptSet = new Set(kept);
  const added = catalogOrder.filter((id) => nextSelected.has(id) && !keptSet.has(id));
  return [...kept, ...added];
}

function ClauseContentCell({ content }: { content: string }) {
  const text = content?.trim() ?? "";
  if (!text) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{text}</p>
  );
}

type SortableClauseRowProps = {
  clause: ContractClauseItem;
  disabled?: boolean;
  onRemove: () => void;
};

function SortableClauseRow({ clause, disabled, onRemove }: SortableClauseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: clause.id,
    disabled: !!disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-60 shadow-md relative z-10 bg-card")}
    >
      <TableCell className="w-10 align-top text-center">
        <button
          type="button"
          className={cn(
            "mt-1 inline-flex rounded p-1 text-muted-foreground hover:bg-muted",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing touch-none",
          )}
          aria-label="Kéo để đổi thứ tự"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="align-top text-sm font-medium w-[26%]">{clause.title}</TableCell>
      <TableCell className="align-top">
        <ClauseContentCell content={clause.content} />
      </TableCell>
      <TableCell className="align-top text-center w-12">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onRemove}
          aria-label="Bỏ điều khoản"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function ContractTermsPicker({ value, onChange, disabled }: Props) {
  const { data: groups = [], isLoading: groupsLoading } = useContractClauseGroupsList();
  const { data: clauses = [], isLoading: clausesLoading } = useContractClausesList();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const clauseById = useMemo(() => new Map(clauses.map((c) => [c.id, c])), [clauses]);

  const { tableRows, rowsByGroup, catalogOrder } = useMemo(() => {
    const rows: ClauseTableRow[] = [];
    const inGroup = new Set<string>();

    const sortedGroups = [...groups]
      .filter((g) => g.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

    const seenInGroup = new Set<string>();
    for (const group of sortedGroups) {
      const members = [...group.members]
        .filter((m) => m.clause?.isActive !== false && m.clause)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      for (const m of members) {
        const c = m.clause!;
        if (seenInGroup.has(c.id)) continue;
        seenInGroup.add(c.id);
        inGroup.add(c.id);
        rows.push({
          id: c.id,
          title: c.title,
          content: c.content ?? "",
          groupLabel: group.label,
        });
      }
    }

    const orphans = [...clauses]
      .filter((c) => c.isActive && !inGroup.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

    for (const c of orphans) {
      rows.push({
        id: c.id,
        title: c.title,
        content: c.content ?? "",
        groupLabel: "Khác",
      });
    }

    const map = new Map<string, ClauseTableRow[]>();
    for (const row of rows) {
      if (!map.has(row.groupLabel)) map.set(row.groupLabel, []);
      map.get(row.groupLabel)!.push(row);
    }

    return {
      tableRows: rows,
      rowsByGroup: map,
      catalogOrder: rows.map((r) => r.id),
    };
  }, [groups, clauses]);

  const selectedClauses = useMemo(
    () =>
      value
        .map((id) => clauseById.get(id))
        .filter((c): c is ContractClauseItem => Boolean(c)),
    [value, clauseById],
  );

  const draftSelected = useMemo(() => new Set(draftIds), [draftIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (pickerOpen) setDraftIds([...value]);
  }, [pickerOpen, value]);

  const applyDraftSelection = (nextSelected: Set<string>) => {
    setDraftIds(orderSelection(draftIds, nextSelected, catalogOrder));
  };

  const toggleDraftClause = (clauseId: string, checked: boolean) => {
    if (disabled) return;
    const next = new Set(draftIds);
    if (checked) next.add(clauseId);
    else next.delete(clauseId);
    applyDraftSelection(next);
  };

  const handleConfirm = () => {
    onChange(draftIds);
    setPickerOpen(false);
  };

  const handleRemove = (clauseId: string) => {
    if (disabled) return;
    onChange(value.filter((id) => id !== clauseId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;
    const oldIndex = value.indexOf(String(active.id));
    const newIndex = value.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  if (groupsLoading || clausesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (tableRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Chưa có điều khoản mẫu. Thêm tại Cài đặt → Thuộc tính → Hợp đồng.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={() => setPickerOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Thêm điều khoản và điều kiện
      </Button>

      {selectedClauses.length > 0 ? (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border/60 bg-muted/20">
            Kéo thả để sắp xếp thứ tự điều khoản trên hợp đồng
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead className="w-[26%]">Tiêu đề</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={value} strategy={verticalListSortingStrategy}>
                  {selectedClauses.map((clause) => (
                    <SortableClauseRow
                      key={clause.id}
                      clause={clause}
                      disabled={disabled}
                      onRemove={() => handleRemove(clause.id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa chọn điều khoản nào.</p>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn điều khoản và điều kiện</DialogTitle>
          </DialogHeader>

          <div className={clausePickerStyles.panel}>
            <div className={clausePickerStyles.headerGrid}>
              <div className={clausePickerStyles.headerColCheck} aria-hidden />
              <div className={clausePickerStyles.headerColTitle}>Tiêu đề</div>
              <div className={clausePickerStyles.headerColContent}>Nội dung</div>
            </div>
            {[...rowsByGroup.entries()].map(([groupLabel, rows]) => (
              <Fragment key={groupLabel}>
                <div className={clausePickerStyles.groupRow}>
                  <div aria-hidden />
                  <div className={clausePickerStyles.groupLabel}>{groupLabel}</div>
                </div>
                {rows.map((row) => (
                  <div
                    key={`${groupLabel}-${row.id}`}
                    className={cn(clausePickerStyles.clauseRow, draftSelected.has(row.id) && "bg-primary/5")}
                  >
                    <div className={clausePickerStyles.clauseCheck}>
                      <Checkbox
                        disabled={disabled}
                        checked={draftSelected.has(row.id)}
                        onCheckedChange={(v) => toggleDraftClause(row.id, v === true)}
                      />
                    </div>
                    <div className={clausePickerStyles.clauseTitle}>{row.title}</div>
                    <div className={clausePickerStyles.clauseContent}>
                      {row.content?.trim() ? (
                        <span className="whitespace-pre-wrap line-clamp-4">{row.content.trim()}</span>
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={disabled}>
              Xác nhận ({draftIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
