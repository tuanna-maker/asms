import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import type { ReportsApi } from "@/hooks/use-reports-api";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";

type Props = {
  reports?: ReportsApi;
  isLoading?: boolean;
};

export function UnitPerformanceTab({ reports, isLoading }: Props) {
  const unitPerformance = reports?.unit_performance ?? [];
  const listPag = usePaginatedSlice(unitPerformance);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Chỉ số theo vai trò người dùng gán nhiệm vụ (Task) trong hệ thống — chưa map master đơn vị tổ chức riêng.
      </p>
      {unitPerformance.length === 0 ? (
        <ReportsEmptyState text="Chưa có dữ liệu hiệu suất trong kỳ đã chọn." />
      ) : (
        <>
          <div className="space-y-4 lg:hidden">
            {listPag.pagedItems.map((u) => (
              <UnitCard key={u.unit} unit={u} />
            ))}
          </div>
          <div className="hidden rounded-xl border border-border/50 bg-card p-4 shadow-sm lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vai trò / phòng ban</TableHead>
                  <TableHead className="text-right">Nhiệm vụ</TableHead>
                  <TableHead className="text-right">Hoàn thành</TableHead>
                  <TableHead className="text-right">Đúng hạn</TableHead>
                  <TableHead className="text-right">Hài lòng %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listPag.pagedItems.map((u) => (
                  <TableRow key={u.unit}>
                    <TableCell>{u.unit}</TableCell>
                    <TableCell className="text-right">{u.tasks}</TableCell>
                    <TableCell className="text-right text-success">{u.completed}</TableCell>
                    <TableCell className="text-right text-primary">{u.onTime}</TableCell>
                    <TableCell className="text-right">{u.satisfaction}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginatedTableFooter className="mt-3" {...listPag.footerProps} />
          </div>
          <PaginatedTableFooter className="lg:hidden mt-3" {...listPag.footerProps} />
        </>
      )}
    </div>
  );
}

function UnitCard({
  unit,
}: {
  unit: { unit: string; tasks: number; completed: number; onTime: number; satisfaction: number };
}) {
  return (
    <div className="rounded-lg bg-secondary/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-card-foreground">{unit.unit}</span>
        <span className="text-sm text-muted-foreground">
          Hài lòng: <span className="font-bold text-success">{unit.satisfaction}%</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Nhiệm vụ</p>
          <p className="text-lg font-bold">{unit.tasks}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Hoàn thành</p>
          <p className="text-lg font-bold text-success">{unit.completed}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Đúng hạn</p>
          <p className="text-lg font-bold text-primary">{unit.onTime}</p>
        </div>
      </div>
      <div className="mt-2 h-2 rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-success"
          style={{ width: `${unit.tasks > 0 ? (unit.completed / unit.tasks) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
