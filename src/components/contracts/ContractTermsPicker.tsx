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
import { Textarea } from "@/components/ui/textarea";
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
} from "@/hooks/use-contract-clauses-api";
import type { ContractClauseEntry } from "@/lib/contract-clause-items";
import { cn } from "@/lib/utils";
import { clausePickerStyles } from "@/components/settings/attributes/contract-clause-styles";

export type { ContractClauseEntry };

type Props = {
  value: ContractClauseEntry[];
  onChange: (entries: ContractClauseEntry[]) => void;
  disabled?: boolean;
};

type CatalogRow = {
  id: string;
  title: string;
  groupLabel: string;
};

function orderEntries(
  current: ContractClauseEntry[],
  nextSelected: Set<string>,
  catalogOrder: string[],
): ContractClauseEntry[] {
  const contentById = new Map(current.map((e) => [e.clauseId, e.content]));
  const kept = current.filter((e) => nextSelected.has(e.clauseId));
  const keptSet = new Set(kept.map((e) => e.clauseId));
  const added = catalogOrder
    .filter((id) => nextSelected.has(id) && !keptSet.has(id))
    .map((clauseId) => ({ clauseId, content: contentById.get(clauseId) ?? "" }));
  return [...kept, ...added];
}

type SortableClauseRowProps = {
  entry: ContractClauseEntry;
  title: string;
  disabled?: boolean;
  onContentChange: (content: string) => void;
  onRemove: () => void;
};

function SortableClauseRow({
  entry,
  title,
  disabled,
  onContentChange,
  onRemove,
}: SortableClauseRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.clauseId,
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
      <TableCell className="align-top text-sm font-medium w-[28%]">{title}</TableCell>
      <TableCell className="align-top">
        <Textarea
          rows={3}
          placeholder="Nhập nội dung điều khoản cho hợp đồng này…"
          value={entry.content}
          disabled={disabled}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[72px] resize-y"
        />
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
  const [draftEntries, setDraftEntries] = useState<ContractClauseEntry[]>([]);

  const clauseById = useMemo(() => new Map(clauses.map((c) => [c.id, c])), [clauses]);

  const { catalogRows, rowsByGroup, catalogOrder } = useMemo(() => {
    const rows: CatalogRow[] = [];
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
        rows.push({ id: c.id, title: c.title, groupLabel: group.label });
      }
    }

    const orphans = [...clauses]
      .filter((c) => c.isActive && !inGroup.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

    for (const c of orphans) {
      rows.push({ id: c.id, title: c.title, groupLabel: "Khác" });
    }

    const map = new Map<string, CatalogRow[]>();
    for (const row of rows) {
      if (!map.has(row.groupLabel)) map.set(row.groupLabel, []);
      map.get(row.groupLabel)!.push(row);
    }

    return {
      catalogRows: rows,
      rowsByGroup: map,
      catalogOrder: rows.map((r) => r.id),
    };
  }, [groups, clauses]);

  const draftSelected = useMemo(() => new Set(draftEntries.map((e) => e.clauseId)), [draftEntries]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    if (pickerOpen) setDraftEntries([...value]);
  }, [pickerOpen, value]);

  const applyDraftSelection = (nextSelected: Set<string>) => {
    setDraftEntries(orderEntries(draftEntries, nextSelected, catalogOrder));
  };

  const toggleDraftClause = (clauseId: string, checked: boolean) => {
    if (disabled) return;
    const next = new Set(draftEntries.map((e) => e.clauseId));
    if (checked) next.add(clauseId);
    else next.delete(clauseId);
    applyDraftSelection(next);
  };

  const toggleDraftGroup = (rows: CatalogRow[], checked: boolean) => {
    if (disabled) return;
    const next = new Set(draftEntries.map((e) => e.clauseId));
    for (const row of rows) {
      if (checked) next.add(row.id);
      else next.delete(row.id);
    }
    applyDraftSelection(next);
  };

  const handleConfirm = () => {
    onChange(draftEntries);
    setPickerOpen(false);
  };

  const handleRemove = (clauseId: string) => {
    if (disabled) return;
    onChange(value.filter((e) => e.clauseId !== clauseId));
  };

  const handleContentChange = (clauseId: string, content: string) => {
    if (disabled) return;
    onChange(value.map((e) => (e.clauseId === clauseId ? { ...e, content } : e)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;
    const oldIndex = value.findIndex((e) => e.clauseId === String(active.id));
    const newIndex = value.findIndex((e) => e.clauseId === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  const resolveTitle = (entry: ContractClauseEntry) =>
    entry.title ?? clauseById.get(entry.clauseId)?.title ?? entry.clauseId;

  if (groupsLoading || clausesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
      </div>
    );
  }

  if (catalogRows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        Chưa có điều khoản mẫu. Thêm tiêu đề tại Cài đặt → Thuộc tính → Hợp đồng.
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

      {value.length > 0 ? (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          <p className="px-3 py-2 text-xs text-muted-foreground border-b border-border/60 bg-muted/20">
            Chọn tiêu đề từ danh mục, nhập nội dung riêng cho hợp đồng này. Kéo thả để sắp xếp thứ tự.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead className="w-[28%]">Tiêu đề</TableHead>
                  <TableHead>Nội dung (trên hợp đồng)</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext
                  items={value.map((e) => e.clauseId)}
                  strategy={verticalListSortingStrategy}
                >
                  {value.map((entry) => (
                    <SortableClauseRow
                      key={entry.clauseId}
                      entry={entry}
                      title={resolveTitle(entry)}
                      disabled={disabled}
                      onContentChange={(content) => handleContentChange(entry.clauseId, content)}
                      onRemove={() => handleRemove(entry.clauseId)}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa chọn điều khoản nào.</p>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Chọn tiêu đề điều khoản</DialogTitle>
          </DialogHeader>

          <div className={clausePickerStyles.panel}>
            <div className={clausePickerStyles.headerGrid}>
              <div className={clausePickerStyles.headerColCheck} aria-hidden />
              <div className={clausePickerStyles.headerColTitle}>Tiêu đề</div>
            </div>
            {[...rowsByGroup.entries()].map(([groupLabel, rows]) => (
              <Fragment key={groupLabel}>
                <div className={clausePickerStyles.groupRow}>
                  <div className={clausePickerStyles.clauseCheck}>
                    <Checkbox
                      disabled={disabled}
                      checked={
                        rows.every((r) => draftSelected.has(r.id))
                          ? true
                          : rows.some((r) => draftSelected.has(r.id))
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(v) => toggleDraftGroup(rows, v === true)}
                    />
                  </div>
                  <div className={clausePickerStyles.groupLabel}>{groupLabel}</div>
                </div>
                {rows.map((row) => (
                  <div
                    key={`${groupLabel}-${row.id}`}
                    className={cn(
                      clausePickerStyles.clauseRow,
                      draftSelected.has(row.id) && "bg-primary/5",
                    )}
                  >
                    <div className={clausePickerStyles.clauseCheck}>
                      <Checkbox
                        disabled={disabled}
                        checked={draftSelected.has(row.id)}
                        onCheckedChange={(v) => toggleDraftClause(row.id, v === true)}
                      />
                    </div>
                    <div className={cn(clausePickerStyles.clauseTitle, "col-span-2")}>{row.title}</div>
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
              Xác nhận ({draftEntries.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
