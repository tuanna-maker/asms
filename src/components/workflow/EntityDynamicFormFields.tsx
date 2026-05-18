import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  isFieldVisible,
  parseFieldSchema,
  type FieldDef,
} from "@/lib/workflow-field-schema";

const HANDOVER_STATUS_OPTIONS = [
  { value: "pending", label: "Chưa bắt đầu" },
  { value: "active", label: "Đang thực hiện" },
  { value: "late", label: "Chậm tiến độ" },
  { value: "completed", label: "Hoàn thành" },
];

type ContractOption = { id: string; code: string; title: string | null; products?: number };

export type EntityDynamicFormFieldsProps = {
  fieldSchema: FieldDef[] | null | undefined;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  contracts: ContractOption[];
  contractSelectDisabled?: boolean;
  workflowEditHref?: string | null;
};

function FieldWrap({
  label,
  id,
  required,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {required ? <span className="text-destructive">* </span> : null}
        {label}
      </Label>
      {children}
    </div>
  );
}

function EntityFieldRow({
  def,
  values,
  onChange,
  contracts,
  contractSelectDisabled,
}: {
  def: FieldDef;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  contracts: ContractOption[];
  contractSelectDisabled?: boolean;
}) {
  const id = `entity-field-${def.key}`;
  const val = values[def.key];

  if (def.dataSource === "readonly_text") {
    return (
      <FieldWrap label={def.label} id={id}>
        <p className="text-sm font-medium">{val == null || val === "" ? "—" : String(val)}</p>
      </FieldWrap>
    );
  }

  if (def.dataSource === "contract") {
    const strVal = typeof val === "string" && val ? val : undefined;
    return (
      <FieldWrap label={def.label} id={id} required={def.required}>
        <Select
          value={strVal}
          onValueChange={(v) => onChange(def.key, v)}
          disabled={contractSelectDisabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Chọn HĐ" />
          </SelectTrigger>
          <SelectContent>
            {contracts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code} — {c.title || "—"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrap>
    );
  }

  if (def.dataSource === "handover_status") {
    const strVal = typeof val === "string" && val ? val : "pending";
    return (
      <FieldWrap label={def.label} id={id} required={def.required}>
        <Select value={strVal} onValueChange={(v) => onChange(def.key, v)}>
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HANDOVER_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrap>
    );
  }

  if (def.type === "date") {
    return (
      <FieldWrap label={def.label} id={id} required={def.required}>
        <Input
          id={id}
          type="date"
          value={val == null ? "" : String(val)}
          onChange={(e) => onChange(def.key, e.target.value)}
        />
      </FieldWrap>
    );
  }

  if (def.type === "select" && def.options?.length) {
    const strVal = val == null || val === "" ? "__none__" : String(val);
    return (
      <FieldWrap label={def.label} id={id} required={def.required}>
        <Select
          value={strVal}
          onValueChange={(v) => onChange(def.key, v === "__none__" ? "" : v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={def.placeholder ?? "Chọn"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— Chưa chọn —</SelectItem>
            {def.options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrap>
    );
  }

  return (
    <FieldWrap label={def.label} id={id} required={def.required}>
      <Input
        id={id}
        value={val == null ? "" : String(val)}
        onChange={(e) => onChange(def.key, e.target.value)}
        placeholder={def.placeholder}
      />
    </FieldWrap>
  );
}

export function EntityDynamicFormFields({
  fieldSchema: rawSchema,
  values,
  onChange,
  contracts,
  contractSelectDisabled,
  workflowEditHref,
}: EntityDynamicFormFieldsProps) {
  const schema = parseFieldSchema(rawSchema ?? []);

  if (schema.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground space-y-2">
        <p>Chưa cấu hình trường phiếu trên quy trình này.</p>
        {workflowEditHref ? (
          <Link to={workflowEditHref} className="text-primary underline-offset-4 hover:underline text-xs">
            Mở cấu hình quy trình →
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {schema.map((def) =>
        isFieldVisible(def, values) ? (
          <EntityFieldRow
            key={def.key}
            def={def}
            values={values}
            onChange={onChange}
            contracts={contracts}
            contractSelectDisabled={contractSelectDisabled}
          />
        ) : null,
      )}
    </div>
  );
}
