import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Users, Phone, Mail, MapPin, FileText, Cake, AlertTriangle,
  X, PlusCircle, Trash2, Wrench, Activity, Edit,
  Building2, CalendarDays, DollarSign,
  Contact as ContactIcon, Bell, BellOff, MessageSquareWarning,
} from "lucide-react";
import { CustomerFeedbackSection } from "@/components/feedback/CustomerFeedbackSection";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { useCustomerDetail } from "@/hooks/use-customers-api";
import {
  useContactsList,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  type ContactRow,
} from "@/hooks/use-contacts-api";
import {
  useCreateAnniversary,
  useDeleteAnniversary,
  useUpdateAnniversary,
  type Anniversary,
} from "@/hooks/use-anniversaries-api";
import {
  useCrmActivitiesList,
  useCreateCrmActivity,
  useDeleteCrmActivity,
  type CrmActivityRow,
} from "@/hooks/use-crm-activities-api";
import {
  useAnniversarySubscriptions,
  useSubscribeAnniversary,
  useUnsubscribeAnniversary,
} from "@/hooks/use-anniversary-subscriptions-api";

type Customer = {
  id: string;
  dbId?: string | null;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  contracts: number;
  activeContracts: number;
};

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** view: chỉ xem + chuông kỷ niệm; edit: cùng layout, sửa thông tin cơ bản / đầu mối / kỷ niệm */
  mode?: "view" | "edit";
  onSave?: (updated: Customer) => void;
}

type ContractRef = {
  id: string;
  code: string;
  title: string;
  status: string;
  value: number;
  startDate: string;
  endDate: string;
  progress: number;
};

type WarrantyRef = {
  id: string;
  code: string;
  issue: string;
  status: string;
  statusCode: string;
  priority: string;
  priorityCode: string;
  createdAt: string;
  resolvedAt: string | null;
};

type CostBreakdownItem = {
  id: string;
  code: string;
  title: string;
  status: string;
  value: number;
  startDate: string;
  endDate: string;
  progress: number;
};

type CustomerSummary = {
  totalContracts: number;
  activeContracts: number;
  revenueTotal: number;
  activeContractValue: number;
  totalContractValue: number;
  openWarranties: number;
  expenseTotal: number;
};

type CustomerDetailData = {
  id: string;
  code?: string;
  name?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  sourceCode?: string;
  companyTypeCode?: string;
  foundedAt?: string;
  contracts?: ContractRef[];
  warranties?: WarrantyRef[];
  anniversaries?: Anniversary[];
  summary?: CustomerSummary;
  costBreakdown?: CostBreakdownItem[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function daysUntil(iso: string, recurring: boolean) {
  const now = new Date();
  const date = new Date(iso);
  if (recurring) {
    date.setFullYear(now.getFullYear());
    if (date.getTime() < now.getTime()) date.setFullYear(now.getFullYear() + 1);
  }
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

const STATUS_MAP: Record<string, string> = {
  active: "Đang thực hiện",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
  draft: "Nháp",
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  call: "Cuộc gọi",
  email: "Email",
  meeting: "Cuộc họp",
  note: "Ghi chú",
};

const CustomerDetailDialog = ({ customer, open, onOpenChange, mode = "view", onSave }: Props) => {
  const isViewMode = mode === "view";
  const canEditBasic = !isViewMode;
  const canEditContacts = !isViewMode;
  const canEditAnniversaries = !isViewMode;
  const customerId = customer?.dbId ?? customer?.id ?? null;
  const { data: detailRaw } = useCustomerDetail(open ? customerId : null);
  const detail = detailRaw as CustomerDetailData | null;

  const { data: contactRows } = useContactsList(open && customerId ? customerId : undefined);
  const contacts = (contactRows ?? []) as ContactRow[];
  const createContactMut = useCreateContact();
  const updateContactMut = useUpdateContact();
  const deleteContactMut = useDeleteContact();

  const createAnniversary = useCreateAnniversary();
  const updateAnniversary = useUpdateAnniversary();
  const deleteAnniversary = useDeleteAnniversary();

  const { data: crmRows } = useCrmActivitiesList(open && customerId ? customerId : undefined);
  const crmActivities = (crmRows ?? []) as CrmActivityRow[];
  const createCrmMut = useCreateCrmActivity();
  const deleteCrmMut = useDeleteCrmActivity();

  const summary = detail?.summary;
  const contracts = detail?.contracts ?? [];
  const warranties = detail?.warranties ?? [];
  const costBreakdown = detail?.costBreakdown ?? [];

  const anniversaries = detail?.anniversaries ?? [];

  const anniversaryIds = useMemo(
    () => (detail?.anniversaries ?? []).map((a) => a.id),
    [detail?.anniversaries],
  );
  const { data: subscribedSet = new Set<string>() } = useAnniversarySubscriptions(
    anniversaryIds,
    open && anniversaryIds.length > 0,
  );
  const subscribeAnniversary = useSubscribeAnniversary();
  const unsubscribeAnniversary = useUnsubscribeAnniversary();

  const toggleAnniversarySubscription = async (anniversaryId: string) => {
    const isSubscribed = subscribedSet.has(anniversaryId);
    try {
      if (isSubscribed) {
        await unsubscribeAnniversary.mutateAsync(anniversaryId);
        toast.success("Đã tắt nhắc kỷ niệm");
      } else {
        await subscribeAnniversary.mutateAsync(anniversaryId);
        toast.success("Đã đăng ký nhận nhắc");
      }
    } catch (e) { toastApiError(e, "Không thể cập nhật đăng ký nhắc");
    }
  };

  const renderAnniversaryBell = (anniversaryId: string) => {
    if (!isViewMode) return null;
    const isSubscribed = subscribedSet.has(anniversaryId);
    const pending = subscribeAnniversary.isPending || unsubscribeAnniversary.isPending;
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 ${isSubscribed ? "text-primary" : "text-muted-foreground"}`}
        onClick={() => void toggleAnniversarySubscription(anniversaryId)}
        disabled={pending}
        aria-label={isSubscribed ? "Tắt nhắc kỷ niệm" : "Nhận nhắc kỷ niệm"}
        title={isSubscribed ? "Đang nhận nhắc — bấm để tắt" : "Bấm để nhận nhắc ngày kỷ niệm"}
      >
        {isSubscribed ? (
          <Bell className="h-3.5 w-3.5 fill-current" />
        ) : (
          <BellOff className="h-3.5 w-3.5" />
        )}
      </Button>
    );
  };

  // --- Anniversary form state ---
  const [annForm, setAnnForm] = useState({
    label: "",
    occursAt: "",
    recurringYearly: true,
    reminderDays: 7,
    notes: "",
  });
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annDialogOpen, setAnnDialogOpen] = useState(false);

  const openCreateAnn = () => {
    setEditingAnnId(null);
    setAnnForm({ label: "", occursAt: "", recurringYearly: true, reminderDays: 7, notes: "" });
    setAnnDialogOpen(true);
  };
  const openEditAnn = (a: Anniversary) => {
    setEditingAnnId(a.id);
    setAnnForm({
      label: a.label,
      occursAt: a.occursAt.slice(0, 10),
      recurringYearly: a.recurringYearly,
      reminderDays: a.reminderDays,
      notes: a.notes ?? "",
    });
    setAnnDialogOpen(true);
  };
  const submitAnniversary = async () => {
    if (!customerId || !annForm.label.trim() || !annForm.occursAt) {
      toast.error("Cần tên và ngày kỷ niệm");
      return;
    }
    try {
      if (editingAnnId) {
        await updateAnniversary.mutateAsync({
          id: editingAnnId,
          payload: {
            label: annForm.label.trim(),
            occursAt: annForm.occursAt,
            recurringYearly: annForm.recurringYearly,
            reminderDays: annForm.reminderDays,
            notes: annForm.notes.trim() || null,
          },
        });
        toast.success("Đã cập nhật kỷ niệm");
      } else {
        await createAnniversary.mutateAsync({
          customerId,
          type: "other",
          label: annForm.label.trim(),
          occursAt: annForm.occursAt,
          recurringYearly: annForm.recurringYearly,
          reminderDays: annForm.reminderDays,
          notes: annForm.notes.trim() || null,
        });
        toast.success("Đã thêm kỷ niệm");
      }
      setAnnDialogOpen(false);
    } catch (e) { toastApiError(e, "Không thể lưu kỷ niệm");
    }
  };
  const onDeleteAnniversary = async (id: string) => {
    try {
      await deleteAnniversary.mutateAsync(id);
      toast.success("Đã xoá");
    } catch (e) { toastApiError(e, "Không xoá được");
    }
  };

  // --- Contact form state ---
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    fullName: "", title: "", rank: "", department: "", phone: "", email: "", birthday: "", isPrimary: false, notes: "",
  });

  const openCreateContact = () => {
    setEditingContactId(null);
    setContactForm({ fullName: "", title: "", rank: "", department: "", phone: "", email: "", birthday: "", isPrimary: false, notes: "" });
    setContactDialogOpen(true);
  };
  const openEditContact = (c: ContactRow) => {
    setEditingContactId(c.id);
    setContactForm({
      fullName: c.fullName,
      title: c.title ?? "",
      rank: c.rank ?? "",
      department: c.department ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      birthday: c.birthday ? c.birthday.slice(0, 10) : "",
      isPrimary: c.isPrimary,
      notes: c.notes ?? "",
    });
    setContactDialogOpen(true);
  };
  const handleSaveContact = async () => {
    if (!contactForm.fullName.trim()) { toast.error("Cần nhập họ tên"); return; }
    if (!customerId) return;
    try {
      const payload = {
        customerId,
        fullName: contactForm.fullName.trim(),
        title: contactForm.title.trim() || undefined,
        rank: contactForm.rank.trim() || undefined,
        department: contactForm.department.trim() || undefined,
        phone: contactForm.phone.trim() || undefined,
        email: contactForm.email.trim() || undefined,
        birthday: contactForm.birthday || null,
        isPrimary: contactForm.isPrimary,
        notes: contactForm.notes.trim() || undefined,
      };
      if (editingContactId) {
        await updateContactMut.mutateAsync({ id: editingContactId, payload });
        toast.success("Đã cập nhật");
      } else {
        await createContactMut.mutateAsync(payload);
        toast.success("Đã thêm liên hệ");
      }
      setContactDialogOpen(false);
    } catch (e) { toastApiError(e, "Không thể lưu liên hệ");
    }
  };
  const handleDeleteContact = async () => {
    if (!deletingContactId) return;
    try {
      await deleteContactMut.mutateAsync(deletingContactId);
      toast.success("Đã xoá liên hệ");
      setDeletingContactId(null);
    } catch (e) { toastApiError(e, "Không thể xoá");
    }
  };

  // --- CRM Activity form ---
  const [crmDialogOpen, setCrmDialogOpen] = useState(false);
  const [crmForm, setCrmForm] = useState({ type: "call" as "call" | "email" | "meeting" | "note", title: "", status: "done" as "done" | "scheduled", activityAt: "" });
  const [deletingCrmId, setDeletingCrmId] = useState<string | null>(null);

  const [basicForm, setBasicForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    if (customer && open && canEditBasic) {
      setBasicForm({
        name: detail?.name ?? customer.name,
        contact: detail?.contactName ?? customer.contact,
        phone: detail?.phone ?? customer.phone,
        email: detail?.email ?? customer.email,
        address: detail?.address ?? customer.address,
      });
    }
  }, [customer, detail, open, canEditBasic]);

  const handleSaveBasicInfo = () => {
    if (!customer || !onSave || !basicForm.name.trim()) {
      toast.error("Cần nhập tên đơn vị");
      return;
    }
    onSave({
      ...customer,
      name: basicForm.name.trim(),
      contact: basicForm.contact.trim(),
      phone: basicForm.phone.trim(),
      email: basicForm.email.trim(),
      address: basicForm.address.trim(),
    });
  };

  const openCreateCrm = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const dtLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setCrmForm({ type: "call", title: "", status: "done", activityAt: dtLocal });
    setCrmDialogOpen(true);
  };
  const handleSaveCrm = async () => {
    if (!crmForm.title.trim() || !customerId) { toast.error("Cần nhập nội dung"); return; }
    try {
      await createCrmMut.mutateAsync({
        customerId,
        type: crmForm.type,
        title: crmForm.title.trim(),
        status: crmForm.status,
        activityAt: new Date(crmForm.activityAt).toISOString(),
      });
      toast.success("Đã thêm hoạt động");
      setCrmDialogOpen(false);
    } catch (e) { toastApiError(e, "Không thể thêm");
    }
  };
  const handleDeleteCrm = async () => {
    if (!deletingCrmId) return;
    try {
      await deleteCrmMut.mutateAsync(deletingCrmId);
      toast.success("Đã xoá hoạt động");
      setDeletingCrmId(null);
    } catch (e) { toastApiError(e, "Không thể xoá");
    }
  };

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-hidden p-0 [&>button]:hidden flex flex-col">
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 space-y-0 border-b border-border bg-background px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>{customer.name}</span>
            <span className="ml-2 text-xs font-normal text-muted-foreground">{customer.id}</span>
            <Badge variant={canEditBasic ? "default" : "secondary"} className="ml-1 text-[10px]">
              {canEditBasic ? "Chỉnh sửa" : "Xem"}
            </Badge>
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Đóng">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border/50 px-6 shrink-0">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabsTrigger value="info" className="data-[state=active]:bg-secondary text-xs sm:text-sm">Thông tin KH</TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-secondary text-xs sm:text-sm">Đầu mối liên lạc</TabsTrigger>
              <TabsTrigger value="care" className="data-[state=active]:bg-secondary text-xs sm:text-sm">Chăm sóc & Tiếp xúc</TabsTrigger>
              <TabsTrigger value="cost" className="data-[state=active]:bg-secondary text-xs sm:text-sm">Chi phí</TabsTrigger>
              <TabsTrigger value="feedback" className="data-[state=active]:bg-secondary text-xs sm:text-sm">Phản ánh</TabsTrigger>
            </TabsList>
          </div>

          {/* ============ TAB 1: THÔNG TIN KHÁCH HÀNG ============ */}
          <TabsContent value="info" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Kpi icon={<FileText className="h-5 w-5 text-primary" />} label="Tổng hợp đồng" value={summary?.totalContracts ?? customer.contracts} />
              <Kpi icon={<FileText className="h-5 w-5 text-emerald-600" />} label="Đang thực hiện" value={summary?.activeContracts ?? customer.activeContracts} />
              <Kpi icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="Phiếu BH mở" value={summary?.openWarranties ?? 0} />
              <Kpi icon={<DollarSign className="h-5 w-5 text-sky-600" />} label="Doanh thu" value={formatCurrency(summary?.revenueTotal ?? 0)} />
              <Kpi icon={<DollarSign className="h-5 w-5 text-violet-600" />} label="HĐ đang chạy" value={formatCurrency(summary?.activeContractValue ?? 0)} />
              <Kpi icon={<DollarSign className="h-5 w-5 text-rose-600" />} label="Chi phí ghi nhận" value={formatCurrency(summary?.expenseTotal ?? 0)} />
            </div>

            <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
              <h4 className="text-sm font-semibold text-card-foreground">Thông tin cơ bản</h4>
              <InfoRow icon={<Building2 className="h-4 w-4" />} label="Mã KH" value={detail?.code ?? customer.id} />
              {canEditBasic ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tên đơn vị *</Label>
                    <Input className="h-8 text-sm" value={basicForm.name} onChange={(e) => setBasicForm((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Người liên hệ</Label>
                    <Input className="h-8 text-sm" value={basicForm.contact} onChange={(e) => setBasicForm((p) => ({ ...p, contact: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Điện thoại</Label>
                    <Input className="h-8 text-sm" value={basicForm.phone} onChange={(e) => setBasicForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input className="h-8 text-sm" type="email" value={basicForm.email} onChange={(e) => setBasicForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">Địa chỉ</Label>
                    <Input className="h-8 text-sm" value={basicForm.address} onChange={(e) => setBasicForm((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                  {onSave ? (
                    <div className="flex justify-end pt-1 sm:col-span-2">
                      <Button size="sm" onClick={handleSaveBasicInfo} disabled={!basicForm.name.trim()}>Lưu thông tin cơ bản</Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <InfoRow icon={<Users className="h-4 w-4" />} label="Tên đơn vị" value={detail?.name ?? customer.name} />
                  <InfoRow icon={<Users className="h-4 w-4" />} label="Người liên hệ" value={detail?.contactName ?? customer.contact} />
                  <InfoRow icon={<Phone className="h-4 w-4" />} label="Điện thoại" value={detail?.phone ?? customer.phone} />
                  <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={detail?.email ?? customer.email} />
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Địa chỉ" value={detail?.address ?? customer.address} />
                </>
              )}
              {detail?.foundedAt && <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Ngày thành lập" value={formatDate(detail.foundedAt)} />}
            </div>

            {contracts.length > 0 && (
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <FileText className="h-4 w-4 text-primary" /> Hợp đồng ({contracts.length})
                </h4>
                <div className="rounded-lg border border-border/50 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-3 py-2">Mã HĐ</TableHead>
                        <TableHead className="px-3 py-2">Tiêu đề</TableHead>
                        <TableHead className="px-3 py-2">Giá trị</TableHead>
                        <TableHead className="px-3 py-2">Thời gian</TableHead>
                        <TableHead className="px-3 py-2">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="px-3 py-2 font-mono text-xs">{c.code}</TableCell>
                          <TableCell className="px-3 py-2 font-medium">{c.title}</TableCell>
                          <TableCell className="px-3 py-2">{formatCurrency(Number(c.value))}</TableCell>
                          <TableCell className="px-3 py-2 text-xs text-muted-foreground">{formatDate(c.startDate)} → {formatDate(c.endDate)}</TableCell>
                          <TableCell className="px-3 py-2"><Badge variant="outline">{STATUS_MAP[c.status] ?? c.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {warranties.length > 0 && (
              <section>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-card-foreground">
                  <Wrench className="h-4 w-4 text-rose-600" /> Phiếu bảo hành gần đây
                </h4>
                <ul className="space-y-2">
                  {warranties.map((w) => (
                    <li key={w.id} className="rounded-md border border-border/50 bg-card p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-card-foreground">
                            <span className="font-mono text-xs text-muted-foreground">{w.code}</span> · {w.issue}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Tạo {formatDate(w.createdAt)}{w.resolvedAt ? ` · Đóng ${formatDate(w.resolvedAt)}` : ""}
                          </p>
                        </div>
                        <Badge variant="outline">{w.statusCode}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </TabsContent>

          {/* ============ TAB 2: ĐẦU MỐI LIÊN LẠC ============ */}
          <TabsContent value="contacts" className="flex-1 overflow-y-auto p-6 space-y-3 mt-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                <ContactIcon className="h-4 w-4 text-primary" /> Đầu mối liên lạc ({contacts.length})
              </h4>
              {canEditContacts && (
                <Button size="sm" variant="outline" onClick={openCreateContact}>
                  <PlusCircle className="h-4 w-4 mr-1" /> Thêm
                </Button>
              )}
            </div>

            {contacts.length === 0 ? (
              <Empty text="Chưa có đầu mối liên lạc nào." />
            ) : (
              <div className="rounded-lg border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">Họ tên</TableHead>
                      <TableHead className="px-3 py-2">Chức vụ</TableHead>
                      <TableHead className="px-3 py-2">Cấp bậc</TableHead>
                      <TableHead className="px-3 py-2">Phòng ban</TableHead>
                      <TableHead className="px-3 py-2">SĐT</TableHead>
                      <TableHead className="px-3 py-2">Email</TableHead>
                      <TableHead className="px-3 py-2">Sinh nhật</TableHead>
                      {canEditContacts && <TableHead className="px-3 py-2 text-right w-20">Thao tác</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contacts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="px-3 py-2 font-medium">
                          {c.fullName}
                          {c.isPrimary && <Badge variant="default" className="ml-1.5 text-[10px] px-1.5 py-0">Chính</Badge>}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.title ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.rank ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.department ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.phone ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.email ?? "—"}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{c.birthday ? formatDate(c.birthday) : "—"}</TableCell>
                        {canEditContacts && (
                          <TableCell className="px-3 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditContact(c)} aria-label="Sửa"><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingContactId(c.id)} aria-label="Xoá"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {canEditContacts && (
            <>
            <Dialog open={contactDialogOpen} onOpenChange={(o) => { setContactDialogOpen(o); if (!o) setEditingContactId(null); }}>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editingContactId ? "Chỉnh sửa đầu mối" : "Thêm đầu mối liên lạc"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Họ tên *</Label><Input value={contactForm.fullName} onChange={(e) => setContactForm((p) => ({ ...p, fullName: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Chức vụ</Label><Input value={contactForm.title} onChange={(e) => setContactForm((p) => ({ ...p, title: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Cấp bậc</Label><Input value={contactForm.rank} onChange={(e) => setContactForm((p) => ({ ...p, rank: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Phòng ban</Label><Input value={contactForm.department} onChange={(e) => setContactForm((p) => ({ ...p, department: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Điện thoại</Label><Input value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Sinh nhật</Label><Input type="date" value={contactForm.birthday} onChange={(e) => setContactForm((p) => ({ ...p, birthday: e.target.value }))} /></div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" className="h-4 w-4 rounded border-input" checked={contactForm.isPrimary} onChange={(e) => setContactForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
                        Liên hệ chính
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label>Ghi chú</Label><Textarea rows={2} value={contactForm.notes} onChange={(e) => setContactForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setContactDialogOpen(false)}>Hủy</Button>
                    <Button onClick={() => void handleSaveContact()} disabled={createContactMut.isPending || updateContactMut.isPending}>
                      {editingContactId ? "Lưu" : "Thêm"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingContactId} onOpenChange={(o) => !o && setDeletingContactId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Xoá đầu mối?</AlertDialogTitle><AlertDialogDescription>Đầu mối sẽ bị xoá mềm. Bạn có chắc chắn?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeleteContact()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteContactMut.isPending}>Xoá</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </>
            )}
          </TabsContent>

          {/* ============ TAB 3: CHĂM SÓC & TIẾP XÚC ============ */}
          <TabsContent value="care" className="flex-1 overflow-y-auto p-6 space-y-5 mt-0">
            {/* Phần A: Ngày kỷ niệm quan trọng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Cake className="h-4 w-4 text-pink-500" /> Ngày kỷ niệm quan trọng
                </h4>
                {canEditAnniversaries && (
                  <Button size="sm" variant="outline" onClick={openCreateAnn}>
                    <PlusCircle className="h-4 w-4 mr-1" /> Thêm
                  </Button>
                )}
              </div>

              {anniversaries.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có ngày kỷ niệm</p>
              ) : (
                <ul className="space-y-2">
                  {anniversaries.map((a) => {
                    const days = daysUntil(a.occursAt, a.recurringYearly);
                    return (
                      <li key={a.id} className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card p-3 text-sm">
                        <div>
                          <p className="font-medium text-card-foreground">{a.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(a.occursAt)} {a.recurringYearly ? "· Hàng năm" : ""} · Nhắc trước {a.reminderDays} ngày
                          </p>
                          {a.notes && <p className="text-xs text-muted-foreground mt-0.5">{a.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Còn {days} ngày</Badge>
                          {renderAnniversaryBell(a.id)}
                          {canEditAnniversaries && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditAnn(a)} aria-label="Sửa"><Edit className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => void onDeleteAnniversary(a.id)} aria-label="Xoá"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

            </div>

            {canEditAnniversaries && (
            <>
            <Dialog open={annDialogOpen} onOpenChange={setAnnDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingAnnId ? "Sửa kỷ niệm" : "Thêm kỷ niệm"}</DialogTitle></DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Tên *</Label><Input value={annForm.label} onChange={(e) => setAnnForm((p) => ({ ...p, label: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>Ngày *</Label><Input type="date" value={annForm.occursAt} onChange={(e) => setAnnForm((p) => ({ ...p, occursAt: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nhắc trước (ngày)</Label>
                      <Input type="number" min={0} max={365} value={annForm.reminderDays} onChange={(e) => setAnnForm((p) => ({ ...p, reminderDays: Number(e.target.value) || 0 }))} />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 flex-1">
                        <Label htmlFor="ann-rec-yearly" className="cursor-pointer text-xs">Lặp hàng năm</Label>
                        <Switch id="ann-rec-yearly" checked={annForm.recurringYearly} onCheckedChange={(v) => setAnnForm((p) => ({ ...p, recurringYearly: v }))} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label>Ghi chú</Label><Textarea rows={2} value={annForm.notes} onChange={(e) => setAnnForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setAnnDialogOpen(false)}>Hủy</Button>
                    <Button onClick={() => void submitAnniversary()} disabled={createAnniversary.isPending || updateAnniversary.isPending}>
                      {editingAnnId ? "Lưu" : "Thêm"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </>
            )}

            {/* Phần B: Lịch sử hoạt động chăm sóc */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-600" /> Lịch sử hoạt động chăm sóc
                </h4>

              </div>
              {crmActivities.length === 0 ? (
                <Empty text="Chưa có hoạt động chăm sóc." />
              ) : (
                <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
                  {crmActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {ACTIVITY_TYPE_LABELS[act.type]?.[0] ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground truncate">{act.title}</p>
                          <Badge variant={act.status === "done" ? "secondary" : "default"} className="text-[10px]">
                            {act.status === "done" ? "Hoàn thành" : "Sắp diễn ra"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ACTIVITY_TYPE_LABELS[act.type] ?? act.type} · {formatDate(act.activityAt)}
                          {act.createdBy ? ` · ${act.createdBy.fullName}` : ""}
                        </p>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </TabsContent>

          {/* ============ TAB 4: QUẢN LÝ CHI PHÍ ============ */}
          <TabsContent value="cost" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
            <h4 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" /> Quản lý chi phí
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Kpi icon={<DollarSign className="h-5 w-5 text-sky-600" />} label="Tổng giá trị HĐ" value={formatCurrency(summary?.totalContractValue ?? 0)} />
              <Kpi icon={<DollarSign className="h-5 w-5 text-emerald-600" />} label="Doanh thu (active/done)" value={formatCurrency(summary?.revenueTotal ?? 0)} />
              <Kpi icon={<DollarSign className="h-5 w-5 text-violet-600" />} label="HĐ đang chạy" value={formatCurrency(summary?.activeContractValue ?? 0)} />
            </div>

            {costBreakdown.length === 0 ? (
              <Empty text="Chưa có hợp đồng nào." />
            ) : (
              <div className="rounded-lg border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-3 py-2">Mã HĐ</TableHead>
                      <TableHead className="px-3 py-2">Tiêu đề</TableHead>
                      <TableHead className="px-3 py-2 text-right">Giá trị</TableHead>
                      <TableHead className="px-3 py-2">Thời gian</TableHead>
                      <TableHead className="px-3 py-2 text-center">Tiến độ</TableHead>
                      <TableHead className="px-3 py-2">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costBreakdown.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="px-3 py-2 font-mono text-xs">{c.code}</TableCell>
                        <TableCell className="px-3 py-2 font-medium">{c.title}</TableCell>
                        <TableCell className="px-3 py-2 text-right font-semibold">{formatCurrency(c.value)}</TableCell>
                        <TableCell className="px-3 py-2 text-xs text-muted-foreground">{formatDate(c.startDate)} → {formatDate(c.endDate)}</TableCell>
                        <TableCell className="px-3 py-2 text-center">{c.progress}%</TableCell>
                        <TableCell className="px-3 py-2"><Badge variant="outline">{STATUS_MAP[c.status] ?? c.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell className="px-3 py-2" colSpan={2}>Tổng cộng</TableCell>
                      <TableCell className="px-3 py-2 text-right">{formatCurrency(costBreakdown.reduce((s, c) => s + c.value, 0))}</TableCell>
                      <TableCell className="px-3 py-2" colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="flex-1 overflow-y-auto p-6 mt-0">
            {customerId ? (
              <CustomerFeedbackSection
                customerId={customerId}
                showContextColumns
                readonly={isViewMode}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Không xác định được khách hàng.</p>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const Kpi = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="rounded-lg border border-border/60 bg-card p-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{label}</span></div>
    <p className="mt-1 text-lg font-semibold text-card-foreground">{value}</p>
  </div>
);

const EditableInfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
    <div className="text-primary">{icon}</div>
    <span className="text-xs text-muted-foreground min-w-[80px] shrink-0">{label}</span>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
    <div className="text-primary">{icon}</div>
    <span className="text-xs text-muted-foreground min-w-[80px]">{label}</span>
    <span className="text-sm text-card-foreground">{value || "—"}</span>
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">{text}</div>
);

export default CustomerDetailDialog;
