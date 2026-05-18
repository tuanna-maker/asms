import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldSchemaBuilder } from "@/components/workflow/FieldSchemaBuilder";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import { useRolesList } from "@/hooks/use-roles-api";
import type { UpsertStepPayload, WorkflowModuleKey, WorkflowStepItem } from "@/hooks/use-workflows-api";
import { getModuleStepFieldTemplate } from "@/lib/workflow-field-catalog";
import { parseFieldSchema, type FieldDef } from "@/lib/workflow-field-schema";

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

export function StepUpsertDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
  moduleKey,
  stepIndex = 0,
}: StepUpsertDialogProps) {
  const actionOptions = useDefinitionOptions("workflow_step_action", [
    { value: "submit", label: "Trình ký" },
    { value: "approve", label: "Ký duyệt" },
    { value: "sign", label: "Ký số" },
    { value: "release", label: "Ban hành" },
  ]);
  const phaseOptions = useDefinitionOptions("workflow_phase", [
    { value: "handover", label: "Bàn giao" },
    { value: "training", label: "Huấn luyện" },
    { value: "warranty", label: "Bảo hành" },
    { value: "other", label: "Khác" },
  ]);
  const { data: roles = [], isLoading: rolesLoading } = useRolesList(open);
  const roleOptions = useMemo(
    () =>
      roles
        .filter((r) => r.isActive)
        .map((r) => ({ value: r.code, label: r.name })),
    [roles],
  );

  const [name, setName] = useState("");
  const [actionCode, setActionCode] = useState("approve");
  const [roleCode, setRoleCode] = useState("");
  const [slaHours, setSlaHours] = useState<number | "">(24);
  const [description, setDescription] = useState("");
  const [phaseCode, setPhaseCode] = useState<string>("other");
  const [requireDocument, setRequireDocument] = useState(false);
  const [fieldSchema, setFieldSchema] = useState<FieldDef[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setActionCode(initial.actionCode);
      setRoleCode(initial.roleCode);
      setSlaHours(initial.slaHours ?? "");
      setDescription(initial.description ?? "");
      setPhaseCode(initial.phaseCode || "other");
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
      setActionCode("approve");
      setRoleCode("");
      setSlaHours(24);
      setDescription("");
      setPhaseCode("other");
      setRequireDocument(false);
      setFieldSchema(moduleKey ? getModuleStepFieldTemplate(moduleKey, stepIndex) : []);
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
    if (!actionCode) {
      toast.error("Chọn loại hành động");
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
    await onSubmit({
      name: nm,
      actionCode,
      roleCode,
      slaHours: slaHours === "" ? null : Number(slaHours),
      description: description.trim() || null,
      phaseCode,
      requireDocument,
      fieldSchema: cleanedSchema.length > 0 ? cleanedSchema : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa bước" : "Thêm bước"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="step-name">Tên bước</Label>
            <Input id="step-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hành động</Label>
              <Select value={actionCode} onValueChange={setActionCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <p className="text-xs text-destructive">Chưa có vai trò hoạt động. Tạo vai trò tại Cài đặt → Vai trò.</p>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-1.5">
              <Label>Giai đoạn</Label>
              <Select value={phaseCode} onValueChange={setPhaseCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  {phaseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <div className="space-y-1.5">
            <Label htmlFor="step-desc">Mô tả</Label>
            <Textarea id="step-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <FieldSchemaBuilder
            value={fieldSchema}
            onChange={setFieldSchema}
            moduleKey={moduleKey}
            stepIndex={stepIndex}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "Đang lưu…" : initial ? "Cập nhật" : "Thêm bước"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
