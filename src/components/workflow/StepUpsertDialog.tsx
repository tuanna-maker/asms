import { useEffect, useMemo, useState } from "react";
import { GitBranch, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { FieldSchemaBuilder } from "@/components/workflow/FieldSchemaBuilder";
import { UserMultiSelect } from "@/components/workflow/UserMultiSelect";
import { useRolesList } from "@/hooks/use-roles-api";
import type { UpsertStepPayload, WorkflowModuleKey, WorkflowStepItem } from "@/hooks/use-workflows-api";
import { getModuleStepFieldTemplate } from "@/lib/workflow-field-catalog";
import { findDuplicateFieldKeys, parseFieldSchema, type FieldDef } from "@/lib/workflow-field-schema";

export type StepUpsertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: WorkflowStepItem | null;
  onSubmit: (payload: UpsertStepPayload) => Promise<unknown> | unknown;
  submitting?: boolean;
  moduleKey?: WorkflowModuleKey;
  stepIndex?: number;
};

const ROLE_NONE = "__role_none__";

function defaultPhaseForModule(moduleKey?: WorkflowModuleKey): string {
  switch (moduleKey) {
    case "handover":
      return "handover";
    case "warranty":
      return "warranty";
    case "training":
    case "coaching":
      return "training";
    case "product":
      return "product";
    default:
      return "other";
  }
}

export function StepUpsertDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
  moduleKey,
  stepIndex = 0,
}: StepUpsertDialogProps) {
  const { data: roles = [], isLoading: rolesLoading } = useRolesList(open);
  const roleOptions = useMemo(
    () =>
      roles
        .filter((r) => r.isActive)
        .map((r) => ({ value: r.code, label: r.name })),
    [roles],
  );

  const [name, setName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [requireDocument, setRequireDocument] = useState(false);
  const [fieldSchema, setFieldSchema] = useState<FieldDef[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setRoleCode(initial.roleCode);
      setAssigneeIds(initial.assigneeIds ?? []);
      setRequireDocument(Boolean(initial.requireDocument));
      const parsed = parseFieldSchema(initial.fieldSchema);
      setFieldSchema(
        parsed.length > 0
          ? parsed
          : moduleKey
            ? getModuleStepFieldTemplate(moduleKey, stepIndex)
            : [],
      );
    } else {
      setName("");
      setRoleCode("");
      setAssigneeIds([]);
      setRequireDocument(false);
      // Thêm bước thủ công: không gán sẵn field — dùng «Tạo N bước chuẩn» nếu cần mẫu đầy đủ
      setFieldSchema([]);
    }
  }, [open, initial?.id, moduleKey, stepIndex]);

  useEffect(() => {
    if (!open || initial) return;
    setRoleCode((prev) => prev || roleOptions[0]?.value || "");
  }, [open, initial, roleOptions]);

  const submit = async () => {
    const nm = name.trim();
    if (!nm) {
      toast.error("Tên bước là bắt buộc");
      return;
    }
    if (!roleCode) {
      toast.error("Chọn vai trò xử lý");
      return;
    }
    const cleanedSchema = fieldSchema
      .filter((f) => f.key.trim() && f.label.trim())
      .map((f) => {
        if (f.type !== "select") {
          const { options: _o, definitionCategory: _d, ...rest } = f;
          return rest;
        }
        const options = (f.options ?? []).filter((o) => o.value.trim() && o.label.trim());
        return {
          ...f,
          ...(f.definitionCategory
            ? { definitionCategory: f.definitionCategory, options: undefined }
            : { options: options.length > 0 ? options : undefined }),
        };
      });
    for (const f of cleanedSchema) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)) {
        toast.error(`Mã trường không hợp lệ: ${f.label}`);
        return;
      }
      if (f.type === "select" && !f.definitionCategory && !(f.options && f.options.length > 0)) {
        toast.error(`Trường chọn «${f.label}» cần danh mục hệ thống hoặc ít nhất một tùy chọn.`);
        return;
      }
    }
    const duplicateKeys = findDuplicateFieldKeys(cleanedSchema);
    if (duplicateKeys.length > 0) {
      toast.error(`Mã trường bị trùng: ${duplicateKeys.join(", ")}`);
      return;
    }
    const payload: UpsertStepPayload = {
      name: nm,
      actionCode: initial?.actionCode ?? "approve",
      roleCode,
      assigneeIds,
      phaseCode: initial?.phaseCode ?? defaultPhaseForModule(moduleKey),
      requireDocument,
      fieldSchema: cleanedSchema.length > 0 ? cleanedSchema : null,
    };
    if (initial?.description) payload.description = initial.description;
    await onSubmit(payload);
  };

  const title = initial ? `Sửa bước: ${initial.name}` : "Thêm bước mới";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,1200px)]"
      >
        <SheetHeader className="flex h-14 shrink-0 flex-row items-center justify-between gap-3 space-y-0 border-b border-border/50 px-5 pr-14">
          <SheetTitle className="m-0 flex min-w-0 items-center gap-2 text-left leading-6">
            <GitBranch className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate leading-6">{title}</span>
          </SheetTitle>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              <Save className="mr-1.5 h-4 w-4" />
              {submitting ? "Đang lưu…" : initial ? "Cập nhật" : "Thêm bước"}
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <section className="space-y-3">
            <div className="border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Thông tin bước</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="step-name">Tên bước</Label>
                <Input id="step-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Vai trò xử lý</Label>
                <Select
                  value={roleCode || ROLE_NONE}
                  onValueChange={(v) => setRoleCode(v === ROLE_NONE ? "" : v)}
                  disabled={rolesLoading || roleOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={rolesLoading ? "Đang tải vai trò…" : "Chọn vai trò"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROLE_NONE} disabled>
                      — Chọn vai trò —
                    </SelectItem>
                    {roleOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!rolesLoading && roleOptions.length === 0 ? (
                  <p className="text-xs text-destructive">
                    Chưa có vai trò hoạt động. Tạo vai trò tại Cài đặt → Vai trò.
                  </p>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <UserMultiSelect
                  value={assigneeIds}
                  onChange={setAssigneeIds}
                  label="Người xử lý"
                  hint="Để trống = mọi người có vai trò xử lý đều được duyệt."
                  addButtonLabel="Thêm người xử lý…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="step-require-doc" className="cursor-pointer text-sm">
                      Yêu cầu tài liệu
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Bắt buộc đính kèm trước khi phê duyệt bước này trên màn nghiệp vụ.
                    </p>
                  </div>
                  <Switch id="step-require-doc" checked={requireDocument} onCheckedChange={setRequireDocument} />
                </div>
                {requireDocument ? (
                  <div className="rounded-md border border-dashed border-amber-300 bg-amber-50/80 px-3 py-3 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                    <p className="font-medium">Ô đính kèm không cấu hình tại đây.</p>
                    <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                      Sau khi lưu, khi xử lý phiếu (bàn giao / huấn luyện / bảo hành…) người dùng sẽ thấy
                      vùng «Tài liệu — {name.trim() || "tên bước"}» (bắt buộc) với nút Đính kèm / kéo thả file.
                    </p>
                    <div className="mt-2 flex items-center justify-between rounded border border-amber-200/80 bg-white/70 px-2 py-2 dark:border-amber-800 dark:bg-background/40">
                      <span className="font-medium text-foreground">Tài liệu (bắt buộc)</span>
                      <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        Đính kèm
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Trường nhập theo bước</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Mỗi dòng 2 trường — cấu hình gọn, dễ so sánh.
              </p>
            </div>
            <FieldSchemaBuilder
              value={fieldSchema}
              onChange={setFieldSchema}
              moduleKey={moduleKey}
              stepIndex={stepIndex}
            />
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
