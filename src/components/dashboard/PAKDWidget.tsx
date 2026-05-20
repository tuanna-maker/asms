import { useMemo, useState } from "react";
import { Wallet, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FullscreenWrapper from "./FullscreenWrapper";
import DashboardPagination from "./DashboardPagination";
import type { PakdSummary } from "@/data/dashboardData";
import { remainingPercent } from "./chartUtils";

const PAGE_SIZE = 20;

interface PAKDWidgetProps {
  data: PakdSummary;
}

type PakdListRow =
  | { kind: "material"; key: string; name: string; remaining: number; total: number; expiresAt?: string | null }
  | { kind: "research"; key: string; code: string; name: string; remaining: number; budget: number; expiresAt: string };

function MaterialRow({ pakd }: { pakd: Extract<PakdListRow, { kind: "material" }> }) {
  const remainPct = remainingPercent(pakd.remaining, pakd.total);
  const isExpired = pakd.expiresAt ? new Date(pakd.expiresAt) <= new Date() : false;
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm mb-1">
        <span className="font-medium text-card-foreground truncate">{pakd.name}</span>
        <span className="text-muted-foreground text-xs sm:text-sm">
          Còn lại: <span className="font-semibold text-card-foreground">{pakd.remaining}</span> / {pakd.total}
          <span className="ml-1 text-muted-foreground">({remainPct}%)</span>
          {pakd.expiresAt && (
            <span className={isExpired ? " text-destructive ml-1" : " ml-1"}>
              ({new Date(pakd.expiresAt).toLocaleDateString("vi-VN")})
            </span>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${isExpired ? "bg-destructive" : "bg-accent"}`}
          style={{ width: `${remainPct}%` }}
        />
      </div>
    </div>
  );
}

function ResearchRow({ p }: { p: Extract<PakdListRow, { kind: "research" }> }) {
  const remainPct = remainingPercent(p.remaining, p.budget);
  const isExpired = new Date(p.expiresAt) <= new Date();
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm mb-1">
        <span className="font-medium text-card-foreground truncate" title={p.name}>
          {p.code} — {p.name}
        </span>
        <span className="text-muted-foreground text-xs sm:text-sm shrink-0">
          KP còn: <span className="font-semibold text-card-foreground">{p.remaining.toLocaleString()}</span>
          <span className="ml-1">({remainPct}%)</span>
          <span className={isExpired ? " text-destructive ml-1" : " ml-1"}>
            ({new Date(p.expiresAt).toLocaleDateString("vi-VN")})
          </span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${isExpired ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${remainPct}%` }}
        />
      </div>
    </div>
  );
}

const PAKDWidget = ({ data }: PAKDWidgetProps) => {
  const [page, setPage] = useState(1);

  const rows = useMemo<PakdListRow[]>(() => {
    const materials: PakdListRow[] = data.materials.items.map((pakd) => ({
      kind: "material",
      key: pakd.warehouse,
      name: pakd.name,
      remaining: pakd.remaining,
      total: pakd.total,
      expiresAt: pakd.expiresAt,
    }));
    const research: PakdListRow[] = data.research.items.map((p) => ({
      kind: "research",
      key: p.id,
      code: p.code,
      name: p.name,
      remaining: p.remaining,
      budget: p.budget,
      expiresAt: p.expiresAt,
    }));
    return [...materials, ...research];
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          <div className="flex gap-1 shrink-0 flex-wrap justify-end">
            <Badge variant="outline" className="text-[10px] border-success/50 text-success">
              HL: {data.materials.valid + data.research.valid}
            </Badge>
            <Badge variant="destructive" className="text-[10px]">
              Hết: {data.materials.expired + data.research.expired}
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Không có dữ liệu PAKD</p>
          ) : (
            pageRows.map((row, idx) => {
              const prev = pageRows[idx - 1];
              const showMaterialLabel = row.kind === "material" && (!prev || prev.kind !== "material");
              const showResearchLabel = row.kind === "research" && (!prev || prev.kind !== "research");
              return (
                <div key={row.kind === "material" ? `m-${row.key}` : `r-${row.key}`}>
                  {showMaterialLabel && (
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Vật tư / kho
                    </p>
                  )}
                  {showResearchLabel && (
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-2 border-t border-border/50 pt-2">
                      <FlaskConical className="h-3.5 w-3.5" /> Đề tài NC
                    </p>
                  )}
                  {row.kind === "material" ? <MaterialRow pakd={row} /> : <ResearchRow p={row} />}
                </div>
              );
            })
          )}
        </div>

        <DashboardPagination
          page={page}
          totalPages={totalPages}
          totalItems={rows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </FullscreenWrapper>
  );
};

export default PAKDWidget;
