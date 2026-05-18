import { Wallet, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FullscreenWrapper from "./FullscreenWrapper";
import type { PakdSummary } from "@/data/dashboardData";

interface PAKDWidgetProps {
  data: PakdSummary;
}

function MaterialSection({ data }: { data: PakdSummary["materials"] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vật tư / kho</p>
        <div className="flex gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] border-success/50 text-success">
            HL: {data.valid}
          </Badge>
          <Badge variant="destructive" className="text-[10px]">
            Hết: {data.expired}
          </Badge>
        </div>
      </div>
      {data.items.map((pakd) => {
        const usedPct = pakd.total > 0 ? Math.round(((pakd.total - pakd.remaining) / pakd.total) * 100) : 0;
        const isExpired = pakd.expiresAt ? new Date(pakd.expiresAt) <= new Date() : false;
        return (
          <div key={pakd.warehouse}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm mb-1">
              <span className="font-medium text-card-foreground truncate">{pakd.name}</span>
              <span className="text-muted-foreground text-xs sm:text-sm">
                Còn lại: <span className="font-semibold text-card-foreground">{pakd.remaining}</span> / {pakd.total}
                {pakd.expiresAt && (
                  <span className={isExpired ? " text-destructive ml-1" : " ml-1"}>
                    ({new Date(pakd.expiresAt).toLocaleDateString("vi-VN")})
                  </span>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-2 rounded-full transition-all ${isExpired ? "bg-destructive" : "bg-accent"}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        );
      })}
      {data.items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">Không có dữ liệu vật tư</p>
      )}
    </div>
  );
}

function ResearchSection({ data }: { data: PakdSummary["research"] }) {
  return (
    <div className="space-y-2 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <FlaskConical className="h-3.5 w-3.5" /> Đề tài NC
        </p>
        <div className="flex gap-1 shrink-0">
          <Badge variant="outline" className="text-[10px] border-success/50 text-success">
            HL: {data.valid}
          </Badge>
          <Badge variant="destructive" className="text-[10px]">
            Hết: {data.expired}
          </Badge>
        </div>
      </div>
      {data.items.map((p) => {
        const usedPct = p.budget > 0 ? Math.round(((p.budget - p.remaining) / p.budget) * 100) : 0;
        const isExpired = new Date(p.expiresAt) <= new Date();
        return (
          <div key={p.id}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm mb-1">
              <span className="font-medium text-card-foreground truncate" title={p.name}>
                {p.code} — {p.name}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm shrink-0">
                KP còn: <span className="font-semibold text-card-foreground">{p.remaining.toLocaleString()}</span>
                <span className={isExpired ? " text-destructive ml-1" : " ml-1"}>
                  ({new Date(p.expiresAt).toLocaleDateString("vi-VN")})
                </span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className={`h-2 rounded-full transition-all ${isExpired ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        );
      })}
      {data.items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">Không có đề tài NC</p>
      )}
    </div>
  );
}

const PAKDWidget = ({ data }: PAKDWidgetProps) => {
  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-card-foreground">Theo dõi PAKD</h3>
            <p className="text-xs text-muted-foreground">
              Vật tư: {data.materials.total} · Đề tài: {data.research.total}
            </p>
          </div>
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto min-h-0">
          <MaterialSection data={data.materials} />
          <ResearchSection data={data.research} />
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default PAKDWidget;
