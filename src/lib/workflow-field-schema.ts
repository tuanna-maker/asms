/** Schema trường nhập liệu động cho từng bước workflow — đồng bộ backend WorkflowStep.fieldSchema */

export type FieldInputType =
  | "text"
  | "textarea_md"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "boolean";

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
  definitionCategory?: string;
  dataSource?: FieldDataSource;
  options?: FieldOption[];
  showWhen?: FieldShowWhen;
};

export const FIELD_INPUT_TYPES: Array<{ value: FieldInputType; label: string }> = [
  { value: "text", label: "Văn bản ngắn" },
  { value: "textarea_md", label: "Văn bản vừa" },
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
    // Chữ đ/Đ tiếng Việt không tách được bằng NFD
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  // Không dùng Date.now() — gây đổi key mỗi lần normalize → vòng lặp onChange vô hạn.
  return base || "field";
}

/** Đảm bảo key không trùng trong danh sách hiện có (thêm hậu tố _2, _3, …). */
export function ensureUniqueFieldKey(key: string, existingKeys: string[]): string {
  const base = key.trim() || "field";
  if (!existingKeys.includes(base)) return base;
  let n = 2;
  while (existingKeys.includes(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

/** Trả về danh sách key bị trùng trong cùng một bước. */
export function findDuplicateFieldKeys(fields: FieldDef[]): string[] {
  const seen = new Set<string>();
  const dups = new Set<string>();
  for (const f of fields) {
    const k = f.key.trim();
    if (!k) continue;
    if (seen.has(k)) dups.add(k);
    else seen.add(k);
  }
  return [...dups];
}

export function isFieldVisible(_def: FieldDef, _values: Record<string, unknown>): boolean {
  // Không còn nhánh showWhen — mọi trường đã khai báo đều hiện; dropdown chỉ chọn giá trị.
  return true;
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
