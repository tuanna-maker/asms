import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportsEmptyState } from "@/components/reports/ReportsEmptyState";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import type { FeedbackStatsByMaterialItem } from "@/hooks/use-feedback-analytics-api";

type Props = {
  items: FeedbackStatsByMaterialItem[];
};

export function FeedbackStatsMaterialsTable({ items }: Props) {
  const tablePag = usePaginatedSlice(items);

  if (items.length === 0) {
    return <ReportsEmptyState text="Chưa có vật tư được gắn trên ticket trong kỳ." />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã VT</TableHead>
            <TableHead>Vật tư</TableHead>
            <TableHead className="text-right">Lần gắn</TableHead>
            <TableHead className="text-right">Ticket</TableHead>
            <TableHead className="text-right">SP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tablePag.pagedItems.map((row) => (
            <TableRow key={row.materialId}>
              <TableCell className="font-mono text-xs">{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell className="text-right">{row.linkageLineCount}</TableCell>
              <TableCell className="text-right">{row.ticketCount}</TableCell>
              <TableCell className="text-right">{row.productCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginatedTableFooter className="mt-3" {...tablePag.footerProps} />
    </>
  );
}
