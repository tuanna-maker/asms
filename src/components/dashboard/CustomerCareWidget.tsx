import { useMemo, useState } from "react";
import { Users, Cake } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FullscreenWrapper from "./FullscreenWrapper";
import DashboardPagination from "./DashboardPagination";
import type { DashboardData } from "@/data/dashboardData";

const ANNIVERSARY_LABELS: Record<string, string> = {
  traditional_day: "Ngày truyền thống",
  medal_day: "Đón nhận danh hiệu",
  leader_birthday: "Sinh nhật lãnh đạo",
  other: "Kỷ niệm khác",
};

const CUSTOMERS_PER_PAGE = 20;
const ANNIVERSARIES_MAX = 20;

function formatRevenueMillion(vnd: number): string {
  return `${Math.round(vnd / 1_000_000).toLocaleString()} tr`;
}

interface CustomerCareWidgetProps {
  customerCare: DashboardData["customerCare"];
}

const CustomerCareWidget = ({ customerCare }: CustomerCareWidgetProps) => {
  const [customerPage, setCustomerPage] = useState(1);

  const customers = useMemo(
    () => customerCare.customerBreakdown.slice().sort((a, b) => b.revenue - a.revenue),
    [customerCare.customerBreakdown],
  );

  const customerTotalPages = Math.max(1, Math.ceil(customers.length / CUSTOMERS_PER_PAGE));
  const pageCustomers = customers.slice(
    (customerPage - 1) * CUSTOMERS_PER_PAGE,
    customerPage * CUSTOMERS_PER_PAGE,
  );

  const anniversaries = customerCare.upcomingAnniversaries.slice(0, ANNIVERSARIES_MAX);

  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-3 shrink-0">
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

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-3">
          <div className="min-h-0 flex flex-col">
            <p className="text-xs font-medium text-muted-foreground mb-2 shrink-0">
              Doanh thu / chi phí / SP bàn giao (triệu đồng)
            </p>
            <div className="rounded-lg border border-border/50 divide-y divide-border/50 min-h-0 overflow-hidden">
              {pageCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 text-center">Chưa có dữ liệu</p>
              ) : (
                pageCustomers.map((c) => (
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
            {customers.length > 0 && (
              <DashboardPagination
                page={customerPage}
                totalPages={customerTotalPages}
                totalItems={customers.length}
                pageSize={CUSTOMERS_PER_PAGE}
                onPageChange={setCustomerPage}
                className="mt-2"
              />
            )}
          </div>

          {anniversaries.length > 0 && (
            <div className="shrink-0 border-t border-border/50 pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Cake className="h-3.5 w-3.5" /> Kỷ niệm (30 ngày tới)
                {customerCare.upcomingAnniversaries.length > ANNIVERSARIES_MAX && (
                  <span className="text-[10px]">+{customerCare.upcomingAnniversaries.length - ANNIVERSARIES_MAX} nữa</span>
                )}
              </p>
              <ul className="space-y-1">
                {anniversaries.map((a, i) => (
                  <li key={`${a.customerId}-${a.type}-${i}`} className="text-xs truncate">
                    <span className="font-medium text-card-foreground">{a.customerName}</span>
                    {" — "}
                    {ANNIVERSARY_LABELS[a.type] ?? a.label}
                    <span className="text-muted-foreground"> ({a.daysUntil} ngày)</span>
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
