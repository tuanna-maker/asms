import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, ClipboardCheck, Package, GraduationCap, FileCheck, CheckCircle, Clock, ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import { useDeleteHandover, useHandoversList, type HandoverListItem } from "@/hooks/use-handovers-api";
import { useTrainingCoursesQuery } from "@/hooks/use-training";
import { useProductsList } from "@/hooks/use-products-api";
import { HandoverUpsertDialog } from "@/components/handover/HandoverUpsertDialog";

const steps = [
  { icon: ClipboardCheck, label: "Lập & phê duyệt KH", key: "plan" },
  { icon: FileCheck, label: "Lập & phê duyệt TTR", key: "ttr" },
  { icon: Package, label: "Chuẩn bị hàng hóa", key: "prepare" },
  { icon: Truck, label: "Bàn giao", key: "handover" },
  { icon: GraduationCap, label: "Huấn luyện", key: "training" },
];

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Đang thực hiện", variant: "default" },
    ongoing: { label: "Đang thực hiện", variant: "default" },
    completed: { label: "Hoàn thành", variant: "secondary" },
    late: { label: "Chậm tiến độ", variant: "destructive" },
    pending: { label: "Chưa bắt đầu", variant: "outline" },
    planned: { label: "Chưa bắt đầu", variant: "outline" },
    cancelled: { label: "Đã hủy", variant: "destructive" },
  };
  const cfg = map[status] || map.pending;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const Handover = () => {
  const { data: handoverRows = [], isLoading, isError, error } = useHandoversList();
  const { data: trainingRows = [], isLoading: isTrainingLoading, isError: isTrainingError, error: trainingError } = useTrainingCoursesQuery();
  const { data: products = [] } = useProductsList();
  const { data: contractOptions = [] } = useQuery({
    queryKey: qk.contracts.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; title: string | null; products: number }>>>("/api/v1/contracts");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState<HandoverListItem | null>(null);
  const [deletingHandover, setDeletingHandover] = useState<HandoverListItem | null>(null);
  const deleteHandover = useDeleteHandover();

  const productCountByContract = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (!product.contractId) continue;
      counts.set(product.contractId, (counts.get(product.contractId) ?? 0) + (Number(product.totalProduced) || 0));
    }
    return counts;
  }, [products]);

  const syncedContractOptions = useMemo(
    () =>
      contractOptions.map((contract) => ({
        ...contract,
        products: productCountByContract.get(contract.id) ?? contract.products ?? 0,
      })),
    [contractOptions, productCountByContract],
  );

  const syncedHandoverRows = useMemo(
    () =>
      handoverRows.map((handover) => ({
        ...handover,
        products: productCountByContract.get(handover.contractId) ?? handover.products,
      })),
    [handoverRows, productCountByContract],
  );

  const syncedTrainingRows = useMemo(
    () =>
      trainingRows.map((course) => ({
        ...course,
        participants: course.contractId ? productCountByContract.get(course.contractId) ?? course.participants : course.participants,
      })),
    [trainingRows, productCountByContract],
  );

  const activeCount = syncedHandoverRows.filter((h) => h.status === "active").length;
  const completedCount = syncedHandoverRows.filter((h) => h.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Workflow Steps */}
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <h3 className="font-semibold text-card-foreground mb-4">Quy trình bàn giao & huấn luyện</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-card-foreground text-center max-w-[70px] sm:max-w-[100px]">{step.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-1 sm:mx-3 mt-[-20px]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng bàn giao</p>
            <p className="text-2xl font-bold text-card-foreground">{syncedHandoverRows.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đang thực hiện</p>
            <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-2xl font-bold text-card-foreground">{completedCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đợt huấn luyện</p>
            <p className="text-2xl font-bold text-card-foreground">{syncedTrainingRows.length}</p>
          </div>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Không tải được danh sách bàn giao."}
        </p>
      )}
      {isTrainingError && (
        <p className="text-sm text-destructive" role="alert">
          {trainingError instanceof Error ? trainingError.message : "Không tải được danh sách huấn luyện."}
        </p>
      )}

      <Tabs defaultValue="handover">
        <TabsList>
          <TabsTrigger value="handover">Bàn giao ({syncedHandoverRows.length})</TabsTrigger>
          <TabsTrigger value="training">Huấn luyện ({syncedTrainingRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="handover">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditingHandover(null);
                setUpsertOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm bàn giao
            </Button>
          </div>
          <div className="rounded-xl bg-card border border-border/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Hợp đồng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-center">SP</TableHead>
                  <TableHead>Bước hiện tại</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right w-28">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : syncedHandoverRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Chưa có bàn giao. Nhấn «Thêm bàn giao» để tạo mới.
                    </TableCell>
                  </TableRow>
                ) : (
                  syncedHandoverRows.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium text-primary">{h.code}</TableCell>
                      <TableCell className="text-muted-foreground">{h.contract.code}</TableCell>
                      <TableCell>{h.customer.name}</TableCell>
                      <TableCell className="text-center">{h.products}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {steps.map((_, i) => (
                              <div key={i} className={`h-2 w-5 rounded-sm ${i < h.currentStep ? "bg-primary" : "bg-secondary"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {steps[Math.min(Math.max(h.currentStep, 1) - 1, steps.length - 1)].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatShortDate(h.startDate)} – {formatShortDate(h.dueDate)}
                      </TableCell>
                      <TableCell>{statusBadge(h.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingHandover(h);
                              setUpsertOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingHandover(h)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="rounded-xl bg-card border border-border/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-center">Học viên</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTrainingLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : syncedTrainingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có dữ liệu huấn luyện.
                    </TableCell>
                  </TableRow>
                ) : (
                  syncedTrainingRows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-primary">{t.id}</TableCell>
                      <TableCell className="text-muted-foreground">{t.title}</TableCell>
                      <TableCell>{t.customer || "-"}</TableCell>
                      <TableCell className="text-center">{t.participants}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                      </TableCell>
                      <TableCell>{statusBadge(t.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <HandoverUpsertDialog
        open={upsertOpen}
        onOpenChange={(o) => {
          setUpsertOpen(o);
          if (!o) setEditingHandover(null);
        }}
        contracts={syncedContractOptions}
        editing={editingHandover}
      />

      <AlertDialog open={deletingHandover !== null} onOpenChange={(o) => !o && setDeletingHandover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bàn giao?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingHandover ? `Phiếu ${deletingHandover.code} sẽ bị gỡ khỏi danh sách.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingHandover) return;
                const id = deletingHandover.id;
                void deleteHandover
                  .mutateAsync(id)
                  .then(() => {
                    toast.success("Đã xóa bàn giao");
                    setDeletingHandover(null);
                  })
                  .catch(() => toast.error("Không xóa được"));
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Handover;
