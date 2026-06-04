import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MaterialFormValues = {
  code: string;
  name: string;
  type: "identified" | "consumable";
  serial: string;
  quantity: number;
  available: number;
  unit: string;
  warehouse: string;
  description: string;
};

type Option = { value: string; label: string };

type Props = {
  values: MaterialFormValues;
  onChange: (patch: Partial<MaterialFormValues>) => void;
  warehouseOptions: Option[];
  unitOptions: Option[];
  /** true = mã chỉ xem (sửa); false = có thể nhập mã khi tạo mới */
  codeReadOnly?: boolean;
  codePlaceholder?: string;
};

export function MaterialUpsertFields({
  values,
  onChange,
  warehouseOptions,
  unitOptions,
  codeReadOnly = false,
  codePlaceholder = "Để trống sẽ tự sinh mã",
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Mã vật tư</Label>
        <Input
          value={values.code}
          onChange={(e) => onChange({ code: e.target.value })}
          readOnly={codeReadOnly}
          className={codeReadOnly ? "bg-muted/40 font-mono" : "font-mono"}
          placeholder={codePlaceholder}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Loại</Label>
        <Select
          value={values.type}
          onValueChange={(v) =>
            onChange({
              type: v as MaterialFormValues["type"],
              serial: v === "consumable" ? "" : values.serial,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consumable">Tiêu hao</SelectItem>
            <SelectItem value="identified">Định danh</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Đơn vị</Label>
        <Select value={values.unit} onValueChange={(v) => onChange({ unit: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Tên vật tư</Label>
        <Input
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nhập tên vật tư"
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Serial</Label>
        <Input
          value={values.serial}
          onChange={(e) => onChange({ serial: e.target.value })}
          disabled={values.type !== "identified"}
          placeholder={
            values.type === "identified" ? "Nhập serial" : "Chỉ áp dụng vật tư định danh"
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tổng số lượng</Label>
        <Input
          type="number"
          min={0}
          value={values.quantity}
          onChange={(e) =>
            onChange({ quantity: Math.max(0, Number(e.target.value) || 0) })
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label>Khả dụng</Label>
        <Input
          type="number"
          min={0}
          value={values.available}
          onChange={(e) =>
            onChange({ available: Math.max(0, Number(e.target.value) || 0) })
          }
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Kho</Label>
        <Select value={values.warehouse} onValueChange={(v) => onChange({ warehouse: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {warehouseOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Mô tả</Label>
        <Textarea
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Ghi chú thêm (tuỳ chọn)"
        />
      </div>
    </div>
  );
}
