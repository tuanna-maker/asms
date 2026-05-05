import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Shield, Monitor, User, Clock, AlertTriangle, CheckCircle, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteWarranty, useUpdateWarranty } from "@/hooks/use-warranties-api";

const workflowSteps = [
  { label: "Tiếp nhận", key: "receive" },
  { label: "Xử lý/Phân loại", key: "classify" },
  { label: "Lập KH xử lý", key: "plan" },
  { label: "Kiểm tra & CĐ", key: "diagnose" },
  { label: "Thực hiện SC", key: "repair" },
  { label: "Kiểm tra sau SC", key: "verify" },
];

export type WarrantyTicketUi = {
  apiId: string;
  code: string;
  customer: string;
  device: string;
  issue: string;
  source: string;
  type: string;
  priority: string;
  step: number;
  /** Lọc tab Danh sách (open/processing → processing) */
  tabStatus: "processing" | "completed";
  backendStatus: "open" | "processing" | "completed" | "cancelled";
  assignee: string;
  sla: string;
  createdAt: string;
};

interface Props {
  ticket: WarrantyTicketUi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityMap: Record<string, { label: string; className: string }> = {
  urgent: { label: "Khẩn cấp", className: "bg-destructive/15 text-destructive border-destructive/30" },
  high: { label: "Cao", className: "bg-destructive/10 text-destructive border-destructive/20" },
  medium: { label: "Trung bình", className: "bg-warning/10 text-warning border-warning/20" },
  low: { label: "Thấp", className: "bg-success/10 text-success border-success/20" },
};

const typeMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  warranty: { label: "Bảo hành", variant: "default" },
  repair: { label: "Sửa chữa", variant: "secondary" },
  maintenance: { label: "Bảo trì", variant: "outline" },
};

const WarrantyDetailDialog = ({ ticket, open, onOpenChange }: Props) => {
  const updateW = useUpdateWarranty();
  const deleteW = useDeleteWarranty();

  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<WarrantyTicketUi["priority"]>("medium");
  const [type, setType] = useState<string>("maintenance");
  const [workflowStep, setWorkflowStep] = useState(1);
  const [status, setStatus] = useState<WarrantyTicketUi["backendStatus"]>("open");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!ticket || !open) return;
    setIssue(ticket.issue);
    setPriority(ticket.priority);
    setType(ticket.type);
    setWorkflowStep(Math.min(Math.max(ticket.step, 1), workflowSteps.length));
    setStatus(ticket.backendStatus);
    setConfirmDelete(false);
  }, [ticket, open]);

  const displayStatus = status === "completed" ? "completed" : status === "cancelled" ? "completed" : "processing";

  const handleSave = async () => {
    if (!ticket) return;
    try {
      await updateW.mutateAsync({
        id: ticket.apiId,
        payload: {
          issue,
          priority: priority as "low" | "medium" | "high" | "urgent",
          type: type as "warranty" | "repair" | "maintenance",
          workflowStep,
          status,
        },
      });
      toast.success("Đã cập nhật ticket");
      onOpenChange(false);
    } catch {
      toast.error("Không lưu được ticket");
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;
    try {
      await deleteW.mutateAsync(ticket.apiId);
      toast.success("Đã xóa ticket");
      setConfirmDelete(false);
      onOpenChange(false);
    } catch {
      toast.error("Không xóa được ticket");
    }
  };

  if (!ticket) return null;

  const pCfg = priorityMap[ticket.priority] || priorityMap.low;
  const tCfg = typeMap[ticket.type] || typeMap.maintenance;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Ticket {ticket.code}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tCfg.variant}>{tCfg.label}</Badge>
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${pCfg.className}`}>{pCfg.label}</span>
              {displayStatus === "completed" ? (
                <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> Hoàn thành</Badge>
              ) : (
                <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Đang xử lý</Badge>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-card-foreground mb-3">Tiến trình xử lý</h4>
              <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1">
                {workflowSteps.map((step, i) => (
                  <div key={step.key} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          i < workflowStep
                            ? displayStatus === "completed"
                              ? "bg-success text-success-foreground"
                              : "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[10px] font-medium text-card-foreground text-center max-w-[70px]">{step.label}</span>
                    </div>
                    {i < workflowSteps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 mt-[-16px]" />}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={<User className="h-4 w-4" />} label="Khách hàng" value={ticket.customer} />
              <InfoItem icon={<Monitor className="h-4 w-4" />} label="Thiết bị" value={ticket.device} />
              <InfoItem icon={<Shield className="h-4 w-4" />} label="Nguồn" value={ticket.source} />
              <InfoItem icon={<User className="h-4 w-4" />} label="Đơn vị xử lý" value={ticket.assignee || "—"} />
              <InfoItem icon={<Clock className="h-4 w-4" />} label="SLA" value={ticket.sla} />
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <h4 className="text-sm font-semibold text-card-foreground">Chỉnh sửa (lưu DB)</h4>
              <div className="space-y-2">
                <Label htmlFor="wi-issue">Mô tả sự cố</Label>
                <Textarea id="wi-issue" value={issue} onChange={(e) => setIssue(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warranty">Bảo hành</SelectItem>
                      <SelectItem value="repair">Sửa chữa</SelectItem>
                      <SelectItem value="maintenance">Bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ưu tiên</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="low">Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Bước hiện tại</Label>
                  <Select value={String(workflowStep)} onValueChange={(v) => setWorkflowStep(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {workflowSteps.map((s, i) => (
                        <SelectItem key={s.key} value={String(i + 1)}>{i + 1}. {s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as WarrantyTicketUi["backendStatus"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Mở</SelectItem>
                      <SelectItem value="processing">Đang xử lý</SelectItem>
                      <SelectItem value="completed">Hoàn thành</SelectItem>
                      <SelectItem value="cancelled">Hủy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Ngày tạo: {ticket.createdAt}
            </div>
          </div>

          <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
            <Button type="button" variant="destructive" className="mr-auto gap-1" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Xóa
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
              <Button type="button" onClick={() => void handleSave()} disabled={updateW.isPending}>
                {updateW.isPending ? "Đang lưu…" : "Lưu"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ticket?</AlertDialogTitle>
            <AlertDialogDescription>Phiếu {ticket.code} sẽ được đánh dấu xóa mềm trên máy chủ.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleteW.isPending}
            >
              {deleteW.isPending ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-card-foreground">{value}</p>
    </div>
  </div>
);

export default WarrantyDetailDialog;
