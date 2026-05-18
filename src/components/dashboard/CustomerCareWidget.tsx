import { Users, Cake, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FullscreenWrapper from "./FullscreenWrapper";
import type { DashboardData } from "@/data/dashboardData";

const ANNIVERSARY_LABELS: Record<string, string> = {
  traditional_day: "Ngày truyền thống",
  medal_day: "Đón nhận danh hiệu",
  leader_birthday: "Sinh nhật lãnh đạo",
  other: "Kỷ niệm khác",
};

const CARE_TYPE_ORDER = ["traditional_day", "medal_day", "leader_birthday", "other"] as const;

function formatRevenueMillion(vnd: number): string {
  return `${Math.round(vnd / 1_000_000).toLocaleString()} tr`;
}

interface CustomerCareWidgetProps {
  customerCare: DashboardData["customerCare"];
}

const CustomerCareWidget = ({ customerCare }: CustomerCareWidgetProps) => {
  const customers = customerCare.customerBreakdown
    .slice()
    .sort((a, b) => b.revenue - a.revenue);

  const anniversariesByType = CARE_TYPE_ORDER.map((type) => ({
    type,
    label: ANNIVERSARY_LABELS[type] ?? type,
    items: customerCare.upcomingAnniversaries.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full flex flex-col min-h-0">
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Chăm sóc khách hàng</h3>
            <p className="text-xs text-muted-foreground">
              Tổng: <span className="font-bold text-card-foreground">{customerCare.totalCustomers}</span> khách hàng
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto space-y-4 min-h-0">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Doanh thu / chi phí / SP bàn giao (triệu đồng)
            </p>
            <div className="rounded-lg border border-border/50 divide-y divide-border/50 max-h-48 overflow-y-auto">
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Chưa có dữ liệu</p>
              ) : (
                customers.map((c) => (
                  <div key={c.id} className="p-2.5 text-xs grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                    <span className="font-medium text-card-foreground truncate">{c.name}</span>
                    <span className="text-muted-foreground text-right">DT: {formatRevenueMillion(c.revenue)}</span>
                    <span className="text-muted-foreground">SP BG: {c.productsDelivered}</span>
                    <span className="text-muted-foreground text-right">CP: {formatRevenueMillion(c.expense)}</span>
                    <span className="col-span-2 flex flex-wrap gap-1 mt-0.5">
                      {c.complaints.processing > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          XL: {c.complaints.processing}
                        </Badge>
                      )}
                      {c.complaints.onTime > 0 && (
                        <Badge variant="outline" className="text-[10px] border-success/50 text-success">
                          Đúng hạn: {c.complaints.onTime}
                        </Badge>
                      )}
                      {c.complaints.late > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          Chậm: {c.complaints.late}
                        </Badge>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {anniversariesByType.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Hoạt động chăm sóc (30 ngày tới)</p>
              <div className="space-y-3">
                {anniversariesByType.map((group) => (
                  <div key={group.type}>
                    <p className="text-[11px] font-medium text-card-foreground mb-1">{group.label}</p>
                    <ul className="space-y-1.5">
                      {group.items.slice(0, 5).map((a, i) => (
                        <li key={`${a.customerId}-${i}`} className="flex items-start gap-2 text-xs">
                          <Cake className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-medium text-card-foreground">{a.customerName}</span>
                            {a.label && a.label !== group.label ? ` — ${a.label}` : ""}
                            <span className="text-muted-foreground"> ({a.daysUntil} ngày)</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {customerCare.upcomingAnniversaries.length === 0 && anniversariesByType.length === 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Cake className="h-3.5 w-3.5" /> Kỷ niệm sắp tới
              </p>
              <p className="text-sm text-muted-foreground">Không có kỷ niệm trong 30 ngày tới</p>
            </div>
          )}

          {customerCare.upcomingAnniversaries.length > 0 && anniversariesByType.length === 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Kỷ niệm sắp tới (30 ngày)
              </p>
              <ul className="space-y-2 max-h-32 overflow-y-auto">
                {customerCare.upcomingAnniversaries.slice(0, 8).map((a, i) => (
                  <li key={`${a.customerId}-${a.type}-${i}`} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-card-foreground">{a.customerName}</span>
                      {" — "}
                      {ANNIVERSARY_LABELS[a.type] ?? a.label}
                      <span className="text-muted-foreground"> ({a.daysUntil} ngày)</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default CustomerCareWidget;
