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
  const [slaHours, setSlaHours] = useState<number | "">(24);
  const [requireDocument, setRequireDocument] = useState(false);
  const [fieldSchema, setFieldSchema] = useState<FieldDef[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setRoleCode(initial.roleCode);
      setAssigneeIds(initial.assigneeIds ?? []);
      setSlaHours(initial.slaHours ?? "");
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
      setSlaHours(24);
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
    const cleanedSchema = fieldSchema.filter((f) => f.key.trim() && f.label.trim());
    for (const f of cleanedSchema) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.key)) {
        toast.error(`Mã trường không hợp lệ: ${f.label}`);
        return;
      }
    }
    const duplicateKeys = findDuplicateFieldKeys(cleanedSchema);
    if (duplicateKeys.length > 0) {
      toast.error(`Mã trường bị trùng: ${duplicateKeys.join(", ")}`);
      return;
    }
    await onSubmit({
      name: nm,
      actionCode: initial?.actionCode ?? "approve",
      roleCode,
      assigneeIds,
      slaHours: slaHours === "" ? null : Number(slaHours),
      description: null,
      phaseCode: initial?.phaseCode ?? defaultPhaseForModule(moduleKey),
      requireDocument,
      fieldSchema: cleanedSchema.length > 0 ? cleanedSchema : null,
    });
  };

  const title = initial ? `Sửa bước: ${initial.name}` : "Thêm bước mới";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[75vw] xl:max-w-[960px] p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-14 space-y-0 shrink-0 gap-3">
          <SheetTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <GitBranch className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">{title}</span>
          </SheetTitle>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submit()} disabled={submitting}>
              <Save className="mr-1.5 h-4 w-4" />
              {submitting ? "Đang lưu…" : initial ? "Cập nhật" : "Thêm bước"}
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5">
          <section className="space-y-3">
            <div className="border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Thông tin bước</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cấu hình tên, vai trò và người xử lý cho bước trong quy trình.
              </p>
            </div>
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
            <UserMultiSelect
              value={assigneeIds}
              onChange={setAssigneeIds}
              label="Người xử lý"
              hint="Tìm theo tên hoặc email. Để trống = mọi người có vai trò xử lý đều được duyệt bước này."
              addButtonLabel="Tìm và thêm người xử lý…"
            />
            <div className="space-y-1.5">
              <Label htmlFor="step-sla">Thời hạn (giờ)</Label>
              <Input
                id="step-sla"
                type="number"
                min={0}
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="step-require-doc" className="cursor-pointer text-sm">
                  Yêu cầu tài liệu
                </Label>
                <p className="text-xs text-muted-foreground">
                  Phải có tài liệu đính kèm trước khi phê duyệt bước này.
                </p>
              </div>
              <Switch id="step-require-doc" checked={requireDocument} onCheckedChange={setRequireDocument} />
            </div>
          </section>

          <section className="space-y-3">
            <div className="border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Trường nhập theo bước</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Các trường hiển thị khi người dùng xử lý bước này trên màn nghiệp vụ.
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
