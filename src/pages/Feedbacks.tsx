import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  Eye,
  Loader2,
  MessageSquareWarning,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomerSearchSelect } from "@/components/common/CustomerSearchSelect";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { CustomerFeedbackDetailSheet } from "@/components/feedback/CustomerFeedbackDetailSheet";
import { CustomerFeedbackFormDialog } from "@/components/feedback/CustomerFeedbackFormDialog";
import {
  useAllCustomerFeedbacksList,
  useDeleteCustomerFeedback,
  type CustomerFeedbackListFilters,
  type CustomerFeedbackRow,
  type CustomerFeedbackSeverity,
  type CustomerFeedbackStatus,
} from "@/hooks/use-customer-feedbacks-api";
import { useRole } from "@/hooks/use-role";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  formatFeedbackDate,
  severityVariant,
  statusVariant,
} from "@/lib/customer-feedback-labels";

const Feedbacks = () => {
  const { canDo } = useRole();
  const canWrite = canDo("phan-anh", "create") || canDo("phan-anh", "update");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string | null>(null);
  const [feedbackFrom, setFeedbackFrom] = useState("");
  const [feedbackTo, setFeedbackTo] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const apiFilters = useMemo((): CustomerFeedbackListFilters => {
    const f: CustomerFeedbackListFilters = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (statusFilter !== "all") f.status = statusFilter as CustomerFeedbackStatus;
    if (severityFilter !== "all") f.severity = severityFilter as CustomerFeedbackSeverity;
    if (customerFilter) f.customerId = customerFilter;
    if (feedbackFrom) f.feedbackFrom = feedbackFrom;
    if (feedbackTo) f.feedbackTo = feedbackTo;
    return f;
  }, [debouncedSearch, statusFilter, severityFilter, customerFilter, feedbackFrom, feedbackTo]);

  const { data: rows = [], isLoading, isError } = useAllCustomerFeedbacksList(apiFilters);
  const deleteMut = useDeleteCustomerFeedback();

  const kpis = useMemo(() => {
    const total = rows.length;
    const byStatus = { new: 0, processing: 0, resolved: 0 };
    for (const r of rows) {
      if (r.status in byStatus) byStatus[r.status as keyof typeof byStatus]++;
    }
    return { total, ...byStatus };
  }, [rows]);

  const resetDeps = useMemo(
    () => [debouncedSearch, statusFilter, severityFilter, customerFilter, feedbackFrom, feedbackTo],
    [debouncedSearch, statusFilter, severityFilter, customerFilter, feedbackFrom, feedbackTo],
  );
  const { pagedItems, footerProps } = usePaginatedSlice(rows, resetDeps);

  const [detailRow, setDetailRow] = useState<CustomerFeedbackRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerFeedbackRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<CustomerFeedbackRow | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: CustomerFeedbackRow) => {
    setDetailRow(null);
    setEditing(row);
    setFormOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteMut.mutateAsync(deleteRow.id);
      toast.success("Đã xóa phản ánh");
      setDeleteRow(null);
      if (detailRow?.id === deleteRow.id) setDetailRow(null);
    } catch {
      toast.error("Không xóa được phản ánh");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
            <MessageSquareWarning className="h-7 w-7 text-amber-600" />
            Phản ánh khách hàng
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Danh sách toàn bộ phản ánh trong hệ thống
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm phản ánh
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Tổng</p>
            <p className="text-2xl font-semibold">{kpis.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Mới</p>
            <p className="text-2xl font-semibold">{kpis.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Đang xử lý</p>
            <p className="text-2xl font-semibold">{kpis.processing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Đã xử lý</p>
            <p className="text-2xl font-semibold">{kpis.resolved}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/30 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tiêu đề, nội dung, tên hoặc mã khách hàng…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {(Object.keys(STATUS_LABELS) as CustomerFeedbackStatus[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {STATUS_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Mức độ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả mức độ</SelectItem>
              {(Object.keys(SEVERITY_LABELS) as CustomerFeedbackSeverity[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SEVERITY_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground px-1">Khách hàng</span>
            <CustomerSearchSelect
              value={customerFilter}
              onChange={setCustomerFilter}
              placeholder="Tất cả KH"
            />
          </div>
          <Input
            type="date"
            value={feedbackFrom}
            onChange={(e) => setFeedbackFrom(e.target.value)}
            aria-label="Từ ngày"
          />
          <Input
            type="date"
            value={feedbackTo}
            onChange={(e) => setFeedbackTo(e.target.value)}
            aria-label="Đến ngày"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải…
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive text-center py-12">Không tải được danh sách phản ánh.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12 rounded-lg border border-dashed">
          Không có phản ánh phù hợp bộ lọc.
        </p>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tiêu đề / Nội dung</TableHead>
                <TableHead>Hợp đồng</TableHead>
                <TableHead>Bảo hành</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày phản ánh</TableHead>
                <TableHead>Người tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    <span className="font-mono text-xs text-muted-foreground block">{row.customer.code}</span>
                    <span className="font-medium">{row.customer.name}</span>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="font-medium truncate" title={row.title}>
                      {row.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" title={row.content}>
                      {row.content}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                    {row.contract ? (
                      <>
                        <span className="font-mono">{row.contract.code}</span>
                        <span className="line-clamp-1">{row.contract.title}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px]">
                    {row.warranty ? (
                      <>
                        <span className="font-mono">{row.warranty.code}</span>
                        <span className="line-clamp-1">{row.warranty.issue}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={severityVariant[row.severity]}>
                      {SEVERITY_LABELS[row.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{STATUS_LABELS[row.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatFeedbackDate(row.feedbackAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.createdBy?.fullName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDetailRow(row)}
                        aria-label="Xem"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(row)}
                            aria-label="Sửa"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {canDo("phan-anh", "delete") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteRow(row)}
                              aria-label="Xóa"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginatedTableFooter {...footerProps} />
        </div>
      )}

      <CustomerFeedbackDetailSheet
        row={detailRow}
        open={Boolean(detailRow)}
        onOpenChange={(o) => !o && setDetailRow(null)}
        readonly={!canWrite}
        onEdit={
          canWrite
            ? (r) => {
                setDetailRow(null);
                openEdit(r);
              }
            : undefined
        }
        onDelete={
          canDo("phan-anh", "delete")
            ? (r) => {
                setDetailRow(null);
                setDeleteRow(r);
              }
            : undefined
        }
      />

      <CustomerFeedbackFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        requireCustomerSelect
        onSuccess={() => setEditing(null)}
      />

      <AlertDialog open={Boolean(deleteRow)} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa phản ánh?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow ? `"${deleteRow.title}"` : ""} — hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void onConfirmDelete()}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Feedbacks;
