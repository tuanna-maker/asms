import { Wallet } from "lucide-react";
import FullscreenWrapper from "./FullscreenWrapper";

interface PAKDItem {
  name: string;
  total: number;
  remaining: number;
}

interface PAKDWidgetProps {
  data: PAKDItem[];
}

const PAKDWidget = ({ data }: PAKDWidgetProps) => {
  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-card-foreground">Theo dõi PAKD</h3>
          <span className="ml-auto text-xl sm:text-2xl font-bold text-card-foreground">{data.length}</span>
        </div>

        <div className="space-y-3 flex-1">
          {data.map((pakd) => {
            const usedPct = pakd.total > 0 ? Math.round(((pakd.total - pakd.remaining) / pakd.total) * 100) : 0;
            return (
              <div key={pakd.name}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm mb-1">
                  <span className="font-medium text-card-foreground truncate">{pakd.name}</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    Còn lại: <span className="font-semibold text-card-foreground">{pakd.remaining}tr</span> / {pakd.total}tr
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className="h-2 rounded-full bg-accent transition-all"
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Không có dữ liệu PAKD</p>
          )}
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default PAKDWidget;
