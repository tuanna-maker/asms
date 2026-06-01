import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  FEEDBACK_STATS_PERIOD_LABELS,
  type FeedbackStatsPeriod,
} from "@/lib/feedback-analytics-filters";

const PERIOD_ORDER: FeedbackStatsPeriod[] = ["day", "1m", "3m", "6m", "1y", "all"];

type Props = {
  value: FeedbackStatsPeriod;
  onChange: (period: FeedbackStatsPeriod) => void;
};

export function FeedbackStatsPeriodBar({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground shrink-0">Kỳ thống kê:</span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onChange(v as FeedbackStatsPeriod);
        }}
        className="flex-wrap justify-start"
      >
        {PERIOD_ORDER.map((p) => (
          <ToggleGroupItem key={p} value={p} size="sm" variant="outline" className="text-xs">
            {FEEDBACK_STATS_PERIOD_LABELS[p]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
