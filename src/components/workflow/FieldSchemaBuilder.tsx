import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FIELD_INPUT_TYPES,
  slugFieldKey,
  type FieldDef,
  type FieldInputType,
} from "@/lib/workflow-field-schema";
import {
  getModuleEntityFieldTemplate,
  getModuleStepFieldTemplate,
} from "@/lib/workflow-field-catalog";
import type { WorkflowModuleKey } from "@/hooks/use-workflows-api";

type Props = {
  value: FieldDef[];
  onChange: (fields: FieldDef[]) => void;
  moduleKey?: WorkflowModuleKey;
  stepIndex?: number;
  /** step = trường từng bước; entity = trường header phiếu */
  variant?: "step" | "entity";
};

const COMMON_DEFINITION_CATEGORIES = [
  "product_category",
  "workflow_step_action",
  "workflow_phase",
  "warranty_priority",
  "warranty_status",
  "contract_type",
];

function emptyField(): FieldDef {
  return { key: "", label: "", type: "text" };
}

export function FieldSchemaBuilder({
  value,
  onChange,
  moduleKey,
  stepIndex = 0,
  variant = "step",
}: Props) {
  const addField = () => onChange([...value, emptyField()]);

  const updateAt = (index: number, patch: Partial<FieldDef>) => {
    onChange(value.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(next);
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Cấu hình trường nhập liệu</p>
          <p className="text-xs text-muted-foreground">
            {variant === "entity"
              ? "Các trường này hiển thị ở phần header phiếu trên màn Bàn giao & HL."
              : "Các trường này hiển thị khi người dùng điền nội dung bước trên màn nghiệp vụ."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variant === "entity" && moduleKey === "handover" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange(getModuleEntityFieldTemplate("handover"))}
            >
              Khôi phục mẫu header bàn giao
            </Button>
          ) : null}
          {variant === "step" &&
          moduleKey &&
          (moduleKey === "handover" || moduleKey === "contract" || moduleKey === "warranty") ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange(getModuleStepFieldTemplate(moduleKey, stepIndex))}
              title="Gán đúng bộ field mẫu cho vị trí bước này trong quy trình chuẩn"
            >
              Khôi phục mẫu bước này
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-1 h-4 w-4" />
            Thêm trường
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">Chưa có trường nào. Nhấn «Thêm trường» để bắt đầu.</p>
      ) : (
        <div className="space-y-3">
          {value.map((field, index) => (
            <div key={index} className="space-y-2 rounded-md border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Trường {index + 1}</span>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Lên">
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === value.length - 1} onClick={() => move(index, 1)} aria-label="Xuống">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAt(index)} aria-label="Xóa trường">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nhãn hiển thị</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      const patch: Partial<FieldDef> = { label };
                      if (!field.key || field.key === slugFieldKey(field.label)) {
                        patch.key = slugFieldKey(label);
                      }
                      updateAt(index, patch);
                    }}
                    placeholder="Ví dụ: Loại hợp đồng"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mã trường (key)</Label>
                  <Input
                    value={field.key}
                    onChange={(e) => updateAt(index, { key: e.target.value.replace(/\s/g, "_") })}
                    placeholder="contract_type"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Kiểu dữ liệu</Label>
                  <Select value={field.type} onValueChange={(v) => updateAt(index, { type: v as FieldInputType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_INPUT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center gap-2">
                    <Switch id={`req-${index}`} checked={Boolean(field.required)} onCheckedChange={(c) => updateAt(index, { required: c })} />
                    <Label htmlFor={`req-${index}`} className="text-xs font-normal cursor-pointer">
                      Bắt buộc
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Placeholder (tùy chọn)</Label>
                <Input value={field.placeholder ?? ""} onChange={(e) => updateAt(index, { placeholder: e.target.value || undefined })} />
              </div>

              {field.type === "select" ? (
                <div className="space-y-2 rounded border border-dashed border-border/50 p-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Danh mục DataDefinition (ưu tiên)</Label>
                    <Select
                      value={field.definitionCategory ?? "__none__"}
                      onValueChange={(v) => updateAt(index, { definitionCategory: v === "__none__" ? undefined : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Không dùng danh mục —</SelectItem>
                        {COMMON_DEFINITION_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {!field.definitionCategory ? (
                    <InlineOptionsEditor options={field.options ?? []} onChange={(options) => updateAt(index, { options })} />
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2 rounded border border-dashed border-border/50 p-2">
                <Label className="text-xs">Hiển thị khi (tùy chọn)</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Select
                    value={field.showWhen?.field ?? "__none__"}
                    onValueChange={(v) => {
                      if (v === "__none__") {
                        updateAt(index, { showWhen: undefined });
                        return;
                      }
                      updateAt(index, { showWhen: { field: v, value: field.showWhen?.value ?? "" } });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Trường điều kiện" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Luôn hiển thị —</SelectItem>
                      {value
                        .filter((_, i) => i !== index && value[i]?.key)
                        .map((f) => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label || f.key}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {field.showWhen ? (
                    <Input
                      placeholder="Giá trị (vd: outsource)"
                      value={
                        Array.isArray(field.showWhen.value)
                          ? field.showWhen.value.join(",")
                          : String(field.showWhen.value ?? "")
                      }
                      onChange={(e) =>
                        updateAt(index, {
                          showWhen: {
                            field: field.showWhen!.field,
                            value: e.target.value.includes(",")
                              ? e.target.value.split(",").map((s) => s.trim())
                              : e.target.value,
                          },
                        })
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineOptionsEditor({
  options,
  onChange,
}: {
  options: Array<{ value: string; label: string }>;
  onChange: (opts: Array<{ value: string; label: string }>) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Tùy chọn (value / nhãn)</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="value"
            value={opt.value}
            onChange={(e) => {
              const next = [...options];
              next[i] = { ...next[i]!, value: e.target.value };
              onChange(next);
            }}
          />
          <Input
            className="flex-1"
            placeholder="Nhãn"
            value={opt.label}
            onChange={(e) => {
              const next = [...options];
              next[i] = { ...next[i]!, label: e.target.value };
              onChange(next);
            }}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(options.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...options, { value: "", label: "" }])}>
        <Plus className="mr-1 h-4 w-4" />
        Thêm tùy chọn
      </Button>
    </div>
  );
}
