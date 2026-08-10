import { useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ensureUniqueFieldKey,
  FIELD_INPUT_TYPES,
  findDuplicateFieldKeys,
  slugFieldKey,
  type FieldDef,
  type FieldInputType,
} from "@/lib/workflow-field-schema";
import { getModuleEntityFieldTemplate } from "@/lib/workflow-field-catalog";
import type { WorkflowModuleKey } from "@/hooks/use-workflows-api";
import {
  ALL_DEFINITION_CATEGORIES,
  getDefinitionCategoryLabel,
} from "@/lib/attribute-settings-config";

type Props = {
  value: FieldDef[];
  onChange: (fields: FieldDef[]) => void;
  moduleKey?: WorkflowModuleKey;
  stepIndex?: number;
  /** step = trường từng bước; entity = trường header phiếu */
  variant?: "step" | "entity";
};

function emptyField(): FieldDef {
  return { key: "", label: "", type: "text" };
}

function normalizeFieldKeys(fields: FieldDef[]): FieldDef[] {
  const usedKeys: string[] = [];
  return fields.map((field, idx) => {
    const existing = field.key?.trim() ?? "";
    const fromLabel = field.label?.trim() ? slugFieldKey(field.label.trim()) : "";
    let base = fromLabel || existing || `truong_${idx + 1}`;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(base)) {
      base = existing && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(existing) ? existing : `truong_${idx + 1}`;
    }
    const key = ensureUniqueFieldKey(base, usedKeys);
    usedKeys.push(key);
    return { ...field, key };
  });
}

export function FieldSchemaBuilder({
  value,
  onChange,
  moduleKey,
  stepIndex = 0,
  variant = "step",
}: Props) {
  const addField = () => onChange(normalizeFieldKeys([...value, emptyField()]));

  const updateAt = (index: number, patch: Partial<FieldDef>) => {
    onChange(normalizeFieldKeys(value.map((f, i) => (i === index ? { ...f, ...patch } : f))));
  };

  const removeAt = (index: number) => onChange(normalizeFieldKeys(value.filter((_, i) => i !== index)));

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[index], next[j]] = [next[j]!, next[index]!];
    onChange(normalizeFieldKeys(next));
  };

  useEffect(() => {
    const normalized = normalizeFieldKeys(value);
    const changed = normalized.some((f, i) => f.key !== value[i]?.key);
    if (changed) onChange(normalized);
    // Chỉ chạy khi value đổi — không đưa onChange vào deps để tránh vòng lặp.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setState ổn định
  }, [value]);

  const duplicateKeys = findDuplicateFieldKeys(value);

  return (
    <div className="space-y-3 rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Cấu hình trường nhập liệu</p>
        <div className="flex flex-wrap gap-2">
          {variant === "entity" && moduleKey === "handover" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onChange(getModuleEntityFieldTemplate("handover"))}
            >
              Khôi phục mẫu header
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-1 h-4 w-4" />
            Thêm trường
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="py-2 text-sm text-muted-foreground">Chưa có trường. Nhấn «Thêm trường».</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {value.map((field, index) => {
            const keyDuplicate = Boolean(field.key.trim() && duplicateKeys.includes(field.key.trim()));
            return (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-md border border-border/40 bg-muted/20 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Trường {index + 1}
                    {keyDuplicate ? (
                      <span className="ml-1 text-destructive">(trùng mã)</span>
                    ) : null}
                  </span>
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Lên"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={index === value.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Xuống"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeAt(index)}
                      aria-label="Xóa trường"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Nhãn</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateAt(index, { label: e.target.value })}
                    placeholder="Ví dụ: Loại hợp đồng"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Kiểu</Label>
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateAt(index, { type: v as FieldInputType })}
                    >
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
                  <div className="flex h-10 items-center gap-2 pb-0.5">
                    <Switch
                      id={`req-${index}`}
                      checked={Boolean(field.required)}
                      onCheckedChange={(c) => updateAt(index, { required: c })}
                    />
                    <Label htmlFor={`req-${index}`} className="cursor-pointer text-xs font-normal">
                      Bắt buộc
                    </Label>
                  </div>
                </div>

                {field.type === "select" ? (
                  <div className="space-y-2 rounded border border-dashed border-border/50 p-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Danh mục hệ thống</Label>
                      <Select
                        value={field.definitionCategory ?? "__none__"}
                        onValueChange={(v) =>
                          updateAt(index, { definitionCategory: v === "__none__" ? undefined : v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Không dùng danh mục —</SelectItem>
                          {ALL_DEFINITION_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {getDefinitionCategoryLabel(c)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!field.definitionCategory ? (
                      <InlineOptionsEditor
                        options={field.options ?? []}
                        onChange={(options) => updateAt(index, { options })}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
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
      <Label className="text-xs">Tùy chọn (mã giá trị / nhãn hiển thị)</Label>
      {options.map((opt, i) => (
        <div key={i} className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Mã giá trị"
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
