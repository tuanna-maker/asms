/** Schema trường nhập liệu động cho từng bước workflow — đồng bộ backend WorkflowStep.fieldSchema */

export type FieldInputType = "text" | "textarea" | "number" | "date" | "select" | "boolean";

export type FieldOption = { value: string; label: string };

export type FieldShowWhen = {
  field: string;
  value: string | string[];
};

export type FieldDataSource = "contract" | "handover_status" | "readonly_text";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldInputType;
  required?: boolean;
  placeholder?: string;
  definitionCategory?: string;
  dataSource?: FieldDataSource;
  options?: FieldOption[];
  showWhen?: FieldShowWhen;
};

export const FIELD_INPUT_TYPES: Array<{ value: FieldInputType; label: string }> = [
  { value: "text", label: "Văn bản ngắn" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "number", label: "Số" },
  { value: "date", label: "Ngày" },
  { value: "select", label: "Danh sách chọn" },
  { value: "boolean", label: "Có / Không" },
];

export function parseFieldSchema(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) return [];
  const out: FieldDef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const key = typeof o.key === "string" ? o.key.trim() : "";
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const type = o.type as FieldInputType;
    if (!key || !label) continue;
    if (!FIELD_INPUT_TYPES.some((t) => t.value === type)) continue;
    const def: FieldDef = { key, label, type };
    if (typeof o.required === "boolean") def.required = o.required;
    if (typeof o.placeholder === "string" && o.placeholder.trim()) def.placeholder = o.placeholder.trim();
    if (typeof o.definitionCategory === "string" && o.definitionCategory.trim()) {
      def.definitionCategory = o.definitionCategory.trim();
    }
    const ds = o.dataSource;
    if (ds === "contract" || ds === "handover_status" || ds === "readonly_text") {
      def.dataSource = ds;
    }
    if (Array.isArray(o.options)) {
      def.options = o.options
        .filter((opt): opt is FieldOption => {
          if (!opt || typeof opt !== "object") return false;
          const v = (opt as FieldOption).value;
          const l = (opt as FieldOption).label;
          return typeof v === "string" && typeof l === "string";
        })
        .map((opt) => ({ value: opt.value, label: opt.label }));
    }
    if (o.showWhen && typeof o.showWhen === "object") {
      const sw = o.showWhen as Record<string, unknown>;
      const f = typeof sw.field === "string" ? sw.field : "";
      if (f) {
        def.showWhen = {
          field: f,
          value: sw.value as string | string[],
        };
      }
    }
    out.push(def);
  }
  return out;
}

export function slugFieldKey(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return base || `field_${Date.now()}`;
}

export function isFieldVisible(def: FieldDef, values: Record<string, unknown>): boolean {
  if (!def.showWhen) return true;
  const current = values[def.showWhen.field];
  const want = def.showWhen.value;
  const cur = current == null ? "" : String(current);
  if (Array.isArray(want)) return want.includes(cur);
  return cur === want;
}

export function emptyPayloadForSchema(schema: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of schema) {
    if (f.type === "boolean") out[f.key] = false;
    else out[f.key] = null;
  }
  return out;
}

export function mergePayloadWithSchema(
  schema: FieldDef[],
  existing: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const base = emptyPayloadForSchema(schema);
  if (!existing) return base;
  for (const f of schema) {
    if (Object.prototype.hasOwnProperty.call(existing, f.key)) {
      base[f.key] = existing[f.key];
    }
  }
  return base;
}

/** Ghi chú chung khi bước không có fieldSchema */
export const GENERIC_NOTES_FIELD: FieldDef = {
  key: "notes",
  label: "Ghi chú bước",
  type: "textarea",
};

export function initStepPayloadsForSteps(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null | unknown }>,
  existing?: Record<string, Record<string, unknown>>,
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const step of steps) {
    const schema = parseFieldSchema(step.fieldSchema);
    out[step.id] = schema.length > 0 ? mergePayloadWithSchema(schema, existing?.[step.id]) : {};
  }
  return out;
}
