import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import { isFieldVisible, parseFieldSchema, type FieldDef } from "@/lib/workflow-field-schema";

export type DynamicStepFormFieldsProps = {
  fieldSchema: FieldDef[] | null | undefined;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
  stepDescription?: string | null;
  workflowEditHref?: string | null;
};

function SelectField({
  def,
  value,
  onChange,
  readOnly,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const inlineOpts = def.options ?? [];
  const fromDef = useDefinitionOptions(
    def.definitionCategory ?? "",
    def.definitionCategory ? undefined : inlineOpts,
  );
  const options = def.definitionCategory ? fromDef : inlineOpts;
  const strVal = value == null || value === "" ? "__none__" : String(value);

  return (
    <Select value={strVal} onValueChange={(v) => onChange(v === "__none__" ? "" : v)} disabled={readOnly}>
      <SelectTrigger>
        <SelectValue placeholder={def.placeholder ?? "Chọn"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">— Chưa chọn —</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function fieldGridSpanClass(def: FieldDef): string {
  if (def.type === "textarea" || def.type === "boolean") return "col-span-full";
  return "";
}

function FieldRow({
  def,
  values,
  onChange,
  readOnly,
}: {
  def: FieldDef;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
}) {
  if (!isFieldVisible(def, values)) return null;

  const val = values[def.key];
  const id = `dyn-${def.key}`;

  return (
    <div className={`space-y-1.5 min-w-0 ${fieldGridSpanClass(def)}`}>
      {def.type === "boolean" ? (
        <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
          <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
            {def.label}
            {def.required ? <span className="text-destructive"> *</span> : null}
          </Label>
          <Switch
            id={id}
            checked={Boolean(val)}
            onCheckedChange={(c) => onChange(def.key, c)}
            disabled={readOnly}
          />
        </div>
      ) : (
        <>
          <Label htmlFor={id}>
            {def.label}
            {def.required ? <span className="text-destructive"> *</span> : null}
          </Label>
          {def.type === "textarea" ? (
            <Textarea
              id={id}
              value={val == null ? "" : String(val)}
              onChange={(e) => onChange(def.key, e.target.value)}
              placeholder={def.placeholder}
              readOnly={readOnly}
              rows={4}
            />
          ) : def.type === "select" ? (
            <SelectField
              def={def}
              value={val}
              onChange={(v) => onChange(def.key, v || null)}
              readOnly={readOnly}
            />
          ) : def.type === "date" ? (
            <Input
              id={id}
              type="date"
              value={val == null ? "" : String(val).slice(0, 10)}
              onChange={(e) => onChange(def.key, e.target.value || null)}
              readOnly={readOnly}
            />
          ) : def.type === "number" ? (
            <Input
              id={id}
              type="number"
              value={val == null || val === "" ? "" : String(val)}
              onChange={(e) =>
                onChange(def.key, e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder={def.placeholder}
              readOnly={readOnly}
            />
          ) : (
            <Input
              id={id}
              value={val == null ? "" : String(val)}
              onChange={(e) => onChange(def.key, e.target.value)}
              placeholder={def.placeholder}
              readOnly={readOnly}
            />
          )}
        </>
      )}
    </div>
  );
}

export function DynamicStepFormFields({
  fieldSchema: rawSchema,
  values,
  onChange,
  readOnly,
  stepDescription,
  workflowEditHref,
}: DynamicStepFormFieldsProps) {
  const schema = parseFieldSchema(rawSchema ?? []);

  if (schema.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
        {stepDescription ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stepDescription}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Bước này chưa khai báo trường nhập trên màn Quy trình — không hiển thị form tại đây.
        </p>
        {workflowEditHref ? (
          <Link to={workflowEditHref} className="text-xs text-primary underline-offset-4 hover:underline">
            Khai báo trường tại Sửa bước →
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stepDescription ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stepDescription}</p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
        {schema.map((def) => (
          <FieldRow key={def.key} def={def} values={values} onChange={onChange} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
}
