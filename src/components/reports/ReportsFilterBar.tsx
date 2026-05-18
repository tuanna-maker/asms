import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportFilters } from "@/lib/report-filters";

type Props = {
  draft: ReportFilters;
  onDraftChange: (next: ReportFilters) => void;
  onApply: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  canExport?: boolean;
};

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023"];

export function ReportsFilterBar({
  draft,
  onDraftChange,
  onApply,
  onExportExcel,
  onExportPdf,
  canExport = true,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Năm</Label>
        <Select
          value={draft.year ?? ""}
          onValueChange={(year) => onDraftChange({ year, from: undefined, to: undefined })}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Chọn năm" />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={y}>
                Năm {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Từ ngày</Label>
        <Input
          type="date"
          className="w-[160px]"
          value={draft.from ?? ""}
          onChange={(e) => onDraftChange({ ...draft, from: e.target.value || undefined, year: undefined })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Đến ngày</Label>
        <Input
          type="date"
          className="w-[160px]"
          value={draft.to ?? ""}
          onChange={(e) => onDraftChange({ ...draft, to: e.target.value || undefined, year: undefined })}
        />
      </div>
      <Button type="button" onClick={onApply}>
        Áp dụng
      </Button>
      {canExport ? (
        <div className="flex gap-2 sm:ml-auto">
          <Button type="button" variant="outline" size="sm" onClick={onExportExcel}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onExportPdf}>
            <FileDown className="mr-1.5 h-4 w-4" />
            Xuất PDF
          </Button>
        </div>
      ) : null}
    </div>
  );
}
