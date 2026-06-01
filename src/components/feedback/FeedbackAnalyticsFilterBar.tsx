import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSearchSelect } from "@/components/common/CustomerSearchSelect";
import type { CustomerFeedbackStatus } from "@/hooks/use-customer-feedbacks-api";
import { STATUS_LABELS } from "@/lib/customer-feedback-labels";
import type { FeedbackAnalyticsFilters } from "@/lib/feedback-analytics-filters";

const YEAR_OPTIONS = ["2026", "2025", "2024", "2023"];

type Props = {
  draft: FeedbackAnalyticsFilters;
  onDraftChange: (next: FeedbackAnalyticsFilters) => void;
  onApply: () => void;
};

export function FeedbackAnalyticsFilterBar({ draft, onDraftChange, onApply }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Năm</Label>
        <Select
          value={draft.year ?? ""}
          onValueChange={(year) => onDraftChange({ ...draft, year, from: undefined, to: undefined })}
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
          onChange={(e) =>
            onDraftChange({ ...draft, from: e.target.value || undefined, year: undefined })
          }
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Đến ngày</Label>
        <Input
          type="date"
          className="w-[160px]"
          value={draft.to ?? ""}
          onChange={(e) =>
            onDraftChange({ ...draft, to: e.target.value || undefined, year: undefined })
          }
        />
      </div>
      <div className="space-y-1 min-w-[200px]">
        <Label className="text-xs text-muted-foreground">Khách hàng</Label>
        <CustomerSearchSelect
          value={draft.customerId ?? null}
          onChange={(id) => onDraftChange({ ...draft, customerId: id ?? undefined })}
          placeholder="Tất cả khách hàng"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Trạng thái</Label>
        <Select
          value={draft.status ?? "all"}
          onValueChange={(v) =>
            onDraftChange({
              ...draft,
              status: v === "all" ? undefined : (v as CustomerFeedbackStatus),
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {(Object.keys(STATUS_LABELS) as CustomerFeedbackStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={onApply} className="sm:ml-auto">
        Áp dụng
      </Button>
    </div>
  );
}
