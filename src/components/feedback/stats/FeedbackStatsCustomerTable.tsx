import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import type { FeedbackStatsByCustomerItem } from "@/hooks/use-feedback-analytics-api";

type Props = {
  items: FeedbackStatsByCustomerItem[];
  isLoading?: boolean;
  onRowClick: (row: FeedbackStatsByCustomerItem) => void;
};

export function FeedbackStatsCustomerTable({ items, isLoading, onRowClick }: Props) {
  const tablePag = usePaginatedSlice(items);
  const totalTickets = items.reduce((s, i) => s + i.ticketCount, 0);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8">Đang tải...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground rounded-md border border-border/50 bg-secondary/20 px-3 py-2">
        Khách hàng có nhiều ticket phản ánh trong kỳ. Bấm một dòng để xem chi tiết từng ticket và liên kết SP/VT.
      </p>
      <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 inline-block">
        <p className="text-xs text-muted-foreground">Tổng ticket (theo kỳ)</p>
        <p className="text-xl font-bold">{totalTickets}</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        {items.length === 0 ? (
          <ReportsEmptyState text="Chưa có phản ánh trong kỳ. Tạo ticket và gắn liên kết SP/VT để có thống kê." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-right">Ticket</TableHead>
                  <TableHead className="text-right">Đang mở</TableHead>
                  <TableHead className="text-right">Đã đóng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tablePag.pagedItems.map((row) => (
                  <TableRow
                    key={row.customerId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(row)}
                  >
                    <TableCell className="font-mono text-xs">{row.code}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right">{row.ticketCount}</TableCell>
                    <TableCell className="text-right">{row.openCount}</TableCell>
                    <TableCell className="text-right">{row.resolvedCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginatedTableFooter className="mt-3" {...tablePag.footerProps} />
          </>
        )}
      </div>
    </div>
  );
}
