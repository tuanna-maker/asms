import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCreateCustomer, useDeleteCustomer, useUpdateCustomer } from "@/hooks/use-customers-api";
import type { ContactRow } from "@/hooks/use-contacts-api";
import {
  useContactsList,
  useCreateContact as useCreateCustomerContact,
  useDeleteContact as useDeleteCustomerContact,
  useUpdateContact as useUpdateCustomerContact,
} from "@/hooks/use-contacts-api";
import type { CrmActivityRow } from "@/hooks/use-crm-activities-api";
import {
  useCrmActivitiesList,
  useCreateCrmActivity,
  useDeleteCrmActivity,
  useUpdateCrmActivity,
} from "@/hooks/use-crm-activities-api";
import {
  Search, Users, Phone, Mail, MapPin, Eye, Edit, Plus, Trash2,
  Activity, Contact as ContactIcon, Trophy, PhoneCall, MessageSquare,
  Calendar as CalendarIcon, CheckCircle2, Star, Crown, Medal, Award,
} from "lucide-react";
import CustomerDetailDialog from "@/components/details/CustomerDetailDialog";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Customer = {
  id: string;
  dbId?: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  contracts: number;
  activeContracts: number;
};

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiCustomerRow = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contractsCount: number;
  activeContracts: number;
  createdAt?: string;
};

function mapCustomerRow(row: ApiCustomerRow): Customer {
  return {
    id: row.code,
    dbId: row.id,
    name: row.name,
    contact: row.contactName ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    contracts: Number(row.contractsCount ?? 0),
    activeContracts: Number(row.activeContracts ?? 0),
  };
}

// ---------- Activities ----------
type ActivityType = "call" | "email" | "meeting" | "note";
type ActivityItem = {
  id: string;
  type: ActivityType;
  title: string;
  customerId: string;
  customerName: string;
  user: string;
  time: string;
  status: "done" | "scheduled";
  activityAtIso: string;
};

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatActivityDisplay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(d);
}

function sameLocalCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function mapCrmRow(row: CrmActivityRow): ActivityItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    customerId: row.customer.code,
    customerName: row.customer.name,
    user: row.createdBy?.fullName ?? "—",
    time: formatActivityDisplay(row.activityAt),
    status: row.status === "scheduled" ? "scheduled" : "done",
    activityAtIso: row.activityAt,
  };
}

const activityMeta: Record<ActivityType, { icon: typeof PhoneCall; label: string; cls: string }> = {
  call:    { icon: PhoneCall,     label: "Cuộc gọi", cls: "bg-info/10 text-info" },
  email:   { icon: Mail,          label: "Email",    cls: "bg-primary/10 text-primary" },
  meeting: { icon: CalendarIcon,  label: "Cuộc họp", cls: "bg-warning/10 text-warning" },
  note:    { icon: MessageSquare, label: "Ghi chú",  cls: "bg-muted text-muted-foreground" },
};

// ---------- Contacts ----------
type ContactItem = { id: string; name: string; title: string; rank: string; department: string; customerId: string; customerName: string; phone: string; email: string; birthday: string; isPrimary: boolean; notes: string };

function mapContactRow(row: ContactRow): ContactItem {
  return {
    id: row.id,
    name: row.fullName,
    title: row.title ?? "",
    rank: row.rank ?? "",
    department: row.department ?? "",
    customerId: row.customer.code,
    customerName: row.customer.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    birthday: row.birthday ?? "",
    isPrimary: row.isPrimary,
    notes: row.notes ?? "",
  };
}

// ---------- Loyalty ----------
type Tier = "Đồng" | "Bạc" | "Vàng" | "Bạch kim";
const tierMeta: Record<Tier, { icon: typeof Medal; cls: string; min: number }> = {
  "Đồng":     { icon: Medal,  cls: "bg-warning/10 text-warning border-warning/30",   min: 0 },
  "Bạc":      { icon: Award,  cls: "bg-muted text-muted-foreground border-border",    min: 5 },
  "Vàng":     { icon: Star,   cls: "bg-warning/15 text-warning border-warning/40",    min: 8 },
  "Bạch kim": { icon: Crown,  cls: "bg-primary/10 text-primary border-primary/30",    min: 12 },
};
const getTier = (contracts: number): Tier =>
  contracts >= tierMeta["Bạch kim"].min ? "Bạch kim" :
  contracts >= tierMeta["Vàng"].min     ? "Vàng" :
  contracts >= tierMeta["Bạc"].min      ? "Bạc" : "Đồng";
const nextTierThreshold = (t: Tier) =>
  t === "Đồng" ? tierMeta["Bạc"].min :
  t === "Bạc"  ? tierMeta["Vàng"].min :
  t === "Vàng" ? tierMeta["Bạch kim"].min : null;

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [createdFrom, setCreatedFrom] = useState<string>("");
  const [createdTo, setCreatedTo] = useState<string>("");

  const { data: apiCustomers } = useQuery({
    queryKey: ["customers", createdFrom, createdTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (createdFrom) params.set("createdFrom", createdFrom);
      if (createdTo) params.set("createdTo", createdTo);
      const qs = params.toString();
      const res = await api.get<ApiSuccess<ApiCustomerRow[]>>(
        qs ? `/api/v1/customers?${qs}` : "/api/v1/customers",
      );
      return (res.data.data ?? []).map(mapCustomerRow);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!apiCustomers) return;
    setCustomers(apiCustomers);
  }, [apiCustomers]);

  const updateCustomerMutation = useUpdateCustomer();
  const createCustomerMutation = useCreateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const { data: contactRows, isLoading: contactsLoading, isError: contactsError } = useContactsList();
  const contacts = useMemo(() => (contactRows ?? []).map(mapContactRow), [contactRows]);
  const createCustomerContactMutation = useCreateCustomerContact();
  const updateCustomerContactMutation = useUpdateCustomerContact();
  const deleteCustomerContactMutation = useDeleteCustomerContact();

  const { data: crmActivityRows, isLoading: activitiesLoading, isError: activitiesError } = useCrmActivitiesList();
  const activities = useMemo(() => (crmActivityRows ?? []).map(mapCrmRow), [crmActivityRows]);
  const createCrmActivityMutation = useCreateCrmActivity();
  const updateCrmActivityMutation = useUpdateCrmActivity();
  const deleteCrmActivityMutation = useDeleteCrmActivity();

  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<{
    type: ActivityType; title: string; customerId: string; status: "done" | "scheduled"; activityAt: string;
  }>({ type: "call", title: "", customerId: "", status: "done", activityAt: toDatetimeLocalValue(new Date()) });

  // Contacts create/edit / delete confirm
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<{ name: string; title: string; rank: string; department: string; customerId: string; phone: string; email: string; birthday: string; isPrimary: boolean; notes: string }>({
    name: "", title: "", rank: "", department: "", customerId: "", phone: "", email: "", birthday: "", isPrimary: false, notes: "",
  });

  // Loyalty edit
  const [editingLoyalty, setEditingLoyalty] = useState<Customer | null>(null);
  const [loyaltyContracts, setLoyaltyContracts] = useState<number>(0);

  const openCreateContact = () => {
    setEditingContactId(null);
    setContactForm({ name: "", title: "", rank: "", department: "", customerId: "", phone: "", email: "", birthday: "", isPrimary: false, notes: "" });
    setContactDialogOpen(true);
  };

  const openEditContact = (c: ContactItem) => {
    setEditingContactId(c.id);
    setContactForm({ name: c.name, title: c.title, rank: c.rank, department: c.department, customerId: c.customerId, phone: c.phone, email: c.email, birthday: c.birthday, isPrimary: c.isPrimary, notes: c.notes });
    setContactDialogOpen(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name.trim()) { toast.error("Vui lòng nhập tên liên hệ"); return; }
    if (!contactForm.customerId) { toast.error("Vui lòng chọn khách hàng"); return; }
    const cust = customers.find((c) => c.id === contactForm.customerId);
    if (!cust) {
      toast.error("Không tìm thấy khách hàng");
      return;
    }
    try {
      const payload = {
        customerId: contactForm.customerId,
        fullName: contactForm.name.trim(),
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
        await updateCustomerContactMutation.mutateAsync({ id: editingContactId, payload });
        toast.success("Đã cập nhật liên hệ");
      } else {
        await createCustomerContactMutation.mutateAsync(payload);
        toast.success("Đã thêm liên hệ");
      }
      setContactDialogOpen(false);
      setEditingContactId(null);
    } catch {
      toast.error(editingContactId ? "Không thể cập nhật liên hệ" : "Không thể thêm liên hệ");
    }
  };

  const handleConfirmDeleteContact = async () => {
    const id = deletingContactId;
    if (!id) return;
    try {
      await deleteCustomerContactMutation.mutateAsync(id);
      toast.success("Đã xóa liên hệ");
      setDeletingContactId(null);
    } catch {
      toast.error("Không thể xóa liên hệ");
    }
  };

  const openEditLoyalty = (c: Customer) => {
    setEditingLoyalty(c);
    setLoyaltyContracts(c.contracts);
  };

  const handleSaveLoyalty = () => {
    if (!editingLoyalty) return;
    const v = Math.max(0, Math.floor(loyaltyContracts || 0));
    setCustomers((prev) => prev.map((c) => c.id === editingLoyalty.id ? { ...c, contracts: v } : c));
    setEditingLoyalty(null);
    toast.success("Đã cập nhật loyalty");
  };

  const filtered = useMemo(
    () => customers.filter(
      (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.contact.toLowerCase().includes(search.toLowerCase())
    ),
    [customers, search]
  );

  const customerListPag = usePaginatedSlice(filtered, [search]);
  const activitiesPag = usePaginatedSlice(activities, [activities.length]);
  const contactsPag = usePaginatedSlice(contacts, [contacts.length]);

  const handleSave = async (updated: Customer) => {
    try {
      await updateCustomerMutation.mutateAsync({
        id: updated.id,
        payload: {
          name: updated.name,
          contactName: updated.contact,
          phone: updated.phone,
          email: updated.email,
          address: updated.address,
        },
      });
      toast.success(`Đã cập nhật khách hàng ${updated.name}`);
    } catch {
      toast.error("Không thể cập nhật khách hàng");
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    const c = deletingCustomer;
    if (!c) return;
    try {
      await deleteCustomerMutation.mutateAsync(c.id);
      toast.success(`Đã xóa khách hàng ${c.name}`);
      setDeletingCustomer(null);
      if (editingCustomer?.id === c.id) setEditingCustomer(null);
    } catch {
      toast.error("Không thể xóa khách hàng");
    }
  };

  const handleCreateCustomer = async () => {
    if (!createForm.name.trim()) {
      toast.error("Vui lòng nhập tên đơn vị");
      return;
    }
    try {
      await createCustomerMutation.mutateAsync({
        name: createForm.name.trim(),
        contactName: createForm.contact.trim() || undefined,
        phone: createForm.phone.trim() || undefined,
        email: createForm.email.trim() || undefined,
        address: createForm.address.trim() || undefined,
        code: "",
      });
      toast.success("Đã thêm khách hàng");
      setShowCreate(false);
      setCreateForm({ name: "", contact: "", phone: "", email: "", address: "" });
    } catch {
      toast.error("Không thể thêm khách hàng");
    }
  };

  const openCreateActivity = () => {
    setEditingActivityId(null);
    setActivityForm({ type: "call", title: "", customerId: "", status: "done", activityAt: toDatetimeLocalValue(new Date()) });
    setActivityDialogOpen(true);
  };

  const openEditActivity = (a: ActivityItem) => {
    setEditingActivityId(a.id);
    setActivityForm({
      type: a.type,
      title: a.title,
      customerId: a.customerId,
      status: a.status,
      activityAt: toDatetimeLocalValue(new Date(a.activityAtIso)),
    });
    setActivityDialogOpen(true);
  };

  const handleSubmitActivity = async () => {
    if (!activityForm.title.trim()) { toast.error("Vui lòng nhập nội dung"); return; }
    if (!activityForm.customerId) { toast.error("Vui lòng chọn khách hàng"); return; }
    const at = new Date(activityForm.activityAt);
    if (Number.isNaN(at.getTime())) { toast.error("Thời gian không hợp lệ"); return; }
    const activityAtIso = at.toISOString();

    try {
      if (editingActivityId) {
        await updateCrmActivityMutation.mutateAsync({
          id: editingActivityId,
          payload: {
            customerId: activityForm.customerId,
            type: activityForm.type,
            title: activityForm.title.trim(),
            status: activityForm.status,
            activityAt: activityAtIso,
          },
        });
        toast.success("Đã cập nhật hoạt động");
      } else {
        await createCrmActivityMutation.mutateAsync({
          customerId: activityForm.customerId,
          type: activityForm.type,
          title: activityForm.title.trim(),
          status: activityForm.status,
          activityAt: activityAtIso,
        });
        toast.success("Đã thêm hoạt động");
      }
      setActivityDialogOpen(false);
      setEditingActivityId(null);
    } catch {
      toast.error(editingActivityId ? "Không thể cập nhật hoạt động" : "Không thể thêm hoạt động");
    }
  };

  const handleDeleteActivity = async () => {
    if (!deletingActivityId) return;
    try {
      await deleteCrmActivityMutation.mutateAsync(deletingActivityId);
      toast.success("Đã xóa hoạt động");
      setDeletingActivityId(null);
    } catch {
      toast.error("Không thể xóa hoạt động");
    }
  };

  const totalContracts = customers.reduce((s, c) => s + c.contracts, 0);
  const activitiesToday = useMemo(
    () => {
      const n = new Date();
      return activities.filter((a) => sameLocalCalendarDay(new Date(a.activityAtIso), n)).length;
    },
    [activities]
  );
  const upcoming = useMemo(
    () => activities.filter((a) => a.status === "scheduled").length,
    [activities]
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-sm text-muted-foreground">Quản lý quan hệ khách hàng — hoạt động, liên hệ, khách hàng & loyalty</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Khách hàng" value={customers.length} tone="primary" />
        <KpiCard icon={<ContactIcon className="h-5 w-5" />} label="Liên hệ" value={contacts.length} tone="info" />
        <KpiCard icon={<Activity className="h-5 w-5" />} label="Hoạt động hôm nay" value={activitiesToday} tone="success" />
        <KpiCard icon={<CalendarIcon className="h-5 w-5" />} label="Sắp diễn ra" value={upcoming} tone="warning" />
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="activities" className="gap-1.5"><Activity className="h-4 w-4" />Hoạt động</TabsTrigger>
          <TabsTrigger value="contacts" className="gap-1.5"><ContactIcon className="h-4 w-4" />Liên hệ</TabsTrigger>
          <TabsTrigger value="customers" className="gap-1.5"><Users className="h-4 w-4" />Khách hàng</TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-1.5"><Trophy className="h-4 w-4" />Loyalty</TabsTrigger>
        </TabsList>

        {/* ---------------- Activities ---------------- */}
        <TabsContent value="activities" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Dòng thời gian hoạt động</h3>
            <Button size="sm" variant="outline" onClick={openCreateActivity}>
              <Plus className="h-4 w-4 mr-1" />Thêm hoạt động
            </Button>
          </div>
          {activitiesError && (
            <p className="text-sm text-destructive">Không tải được hoạt động CRM. Thử lại sau.</p>
          )}
          {activitiesLoading && !activitiesError && (
            <p className="text-sm text-muted-foreground">Đang tải hoạt động…</p>
          )}
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
            {!activitiesLoading && !activitiesError && activitiesPag.pagedItems.map((a) => {
              const meta = activityMeta[a.type];
              const Icon = meta.icon;
              return (
                <div key={a.id} className="group flex items-start gap-3 p-4">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-card-foreground truncate">{a.title}</p>
                      <Badge variant={a.status === "done" ? "secondary" : "default"} className="shrink-0">
                        {a.status === "done" ? "Hoàn thành" : "Sắp diễn ra"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{a.customerName}</span>
                      <span>•</span>
                      <span>{meta.label}</span>
                      <span>•</span>
                      <span>{a.user}</span>
                      <span>•</span>
                      <span>{a.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {a.status === "done" && <CheckCircle2 className="h-4 w-4 text-success mr-1" />}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditActivity(a)} aria-label="Sửa">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingActivityId(a.id)} aria-label="Xóa">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {!activitiesLoading && !activitiesError && activities.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">Chưa có hoạt động nào</div>
            )}
          </div>
          {!activitiesLoading && activities.length > 0 && (
            <PaginatedTableFooter className="mt-2" {...activitiesPag.footerProps} />
          )}

          <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingActivityId ? "Cập nhật hoạt động" : "Thêm hoạt động mới"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Loại hoạt động</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(activityMeta) as ActivityType[]).map((t) => {
                      const M = activityMeta[t];
                      const Icon = M.icon;
                      const active = activityForm.type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setActivityForm((p) => ({ ...p, type: t }))}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                            active ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {M.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Khách hàng</Label>
                  <Select value={activityForm.customerId} onValueChange={(v) => setActivityForm((p) => ({ ...p, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nội dung</Label>
                  <Textarea
                    rows={3}
                    placeholder="Mô tả hoạt động..."
                    value={activityForm.title}
                    onChange={(e) => setActivityForm((p) => ({ ...p, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={activityForm.status} onValueChange={(v: "done" | "scheduled") => setActivityForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="done">Hoàn thành</SelectItem>
                      <SelectItem value="scheduled">Sắp diễn ra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Thời gian</Label>
                  <Input
                    type="datetime-local"
                    value={activityForm.activityAt}
                    onChange={(e) => setActivityForm((p) => ({ ...p, activityAt: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Hủy</Button>
                  <Button
                    onClick={() => void handleSubmitActivity()}
                    disabled={createCrmActivityMutation.isPending || updateCrmActivityMutation.isPending}
                  >
                    {editingActivityId ? "Lưu" : "Thêm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deletingActivityId} onOpenChange={(o) => !o && setDeletingActivityId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa hoạt động?</AlertDialogTitle>
                <AlertDialogDescription>
                  Hoạt động sẽ bị xóa khỏi timeline. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleDeleteActivity()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteCrmActivityMutation.isPending}
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ---------------- Contacts ---------------- */}
        <TabsContent value="contacts" className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Danh sách liên hệ ({contacts.length})</h3>
            <Button size="sm" variant="outline" onClick={openCreateContact}><Plus className="h-4 w-4 mr-1" />Thêm liên hệ</Button>
          </div>
          {contactsError && (
            <p className="text-sm text-destructive">Không tải được danh sách liên hệ. Thử lại sau.</p>
          )}
          {contactsLoading && !contactsError && (
            <p className="text-sm text-muted-foreground">Đang tải liên hệ…</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!contactsLoading && !contactsError && contactsPag.pagedItems.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {c.name.split(" ").pop()?.[0] ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-card-foreground truncate">{c.name}</p>
                      {c.isPrimary && <Badge variant="default" className="text-[10px] px-1.5 py-0">Chính</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[c.title, c.rank, c.department].filter(Boolean).join(" · ") || "—"} · {c.customerName}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone || "—"}</div>
                      <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email || "—"}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContact(c)} aria-label="Sửa liên hệ">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingContactId(c.id)} aria-label="Xóa liên hệ">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!contactsLoading && !contactsError && contacts.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Chưa có liên hệ. Nhấn &quot;Thêm liên hệ&quot; để tạo trên hệ thống.
            </div>
          )}
          {!contactsLoading && contacts.length > 0 && (
            <PaginatedTableFooter className="mt-2" {...contactsPag.footerProps} />
          )}

          <Dialog open={contactDialogOpen} onOpenChange={(o) => { setContactDialogOpen(o); if (!o) setEditingContactId(null); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingContactId ? "Chỉnh sửa liên hệ" : "Thêm liên hệ mới"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Họ tên</Label>
                  <Input value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Chức danh</Label>
                    <Input value={contactForm.title} onChange={(e) => setContactForm((p) => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cấp bậc</Label>
                    <Input value={contactForm.rank} onChange={(e) => setContactForm((p) => ({ ...p, rank: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phòng ban</Label>
                    <Input value={contactForm.department} onChange={(e) => setContactForm((p) => ({ ...p, department: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Khách hàng</Label>
                    <Select value={contactForm.customerId} onValueChange={(v) => setContactForm((p) => ({ ...p, customerId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Điện thoại</Label>
                    <Input value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sinh nhật</Label>
                    <Input type="date" value={contactForm.birthday} onChange={(e) => setContactForm((p) => ({ ...p, birthday: e.target.value }))} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" className="h-4 w-4 rounded border-input" checked={contactForm.isPrimary} onChange={(e) => setContactForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
                      Liên hệ chính
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea rows={2} value={contactForm.notes} onChange={(e) => setContactForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setContactDialogOpen(false); setEditingContactId(null); }}>Hủy</Button>
                  <Button
                    onClick={() => void handleSaveContact()}
                    disabled={createCustomerContactMutation.isPending || updateCustomerContactMutation.isPending}
                  >
                    {editingContactId ? "Lưu" : "Thêm"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog open={!!deletingContactId} onOpenChange={(o) => !o && setDeletingContactId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa liên hệ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Liên hệ sẽ được đánh dấu xóa mềm. Bạn có chắc chắn?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleConfirmDeleteContact()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteCustomerContactMutation.isPending}
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>

        {/* ---------------- Customers ---------------- */}
        <TabsContent value="customers" className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex-1 max-w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Tìm khách hàng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Tạo từ</span>
                <Input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => setCreatedFrom(e.target.value)}
                  className="w-[140px]"
                />
                <span className="text-xs text-muted-foreground">đến</span>
                <Input
                  type="date"
                  value={createdTo}
                  onChange={(e) => setCreatedTo(e.target.value)}
                  className="w-[140px]"
                />
                {(createdFrom || createdTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCreatedFrom("");
                      setCreatedTo("");
                    }}
                  >
                    Xoá
                  </Button>
                )}
              </div>
            </div>
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Thêm khách hàng</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Thêm khách hàng mới</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Tên đơn vị</label><Input placeholder="Tên đơn vị" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Người liên hệ</label><Input placeholder="Họ tên" value={createForm.contact} onChange={(e) => setCreateForm((p) => ({ ...p, contact: e.target.value }))} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-sm font-medium text-foreground">Điện thoại</label><Input placeholder="Số điện thoại" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                    <div className="space-y-2"><label className="text-sm font-medium text-foreground">Email</label><Input placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Địa chỉ</label><Input placeholder="Địa chỉ" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} /></div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                    <Button onClick={handleCreateCustomer}>Thêm</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl bg-card border border-border/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Tên đơn vị</TableHead>
                  <TableHead>Người liên hệ</TableHead>
                  <TableHead>Liên lạc</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="text-center">Tổng HĐ</TableHead>
                  <TableHead className="text-center">HĐ đang TH</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerListPag.pagedItems.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-primary">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.contact}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" />{c.address}</div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{c.contracts}</TableCell>
                    <TableCell className="text-center">
                      {c.activeContracts > 0 ? <Badge variant="default">{c.activeContracts}</Badge> : <span className="text-muted-foreground">0</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(c)} aria-label="Sửa"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(c)} aria-label="Sửa"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCustomer(c)} aria-label="Xóa"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginatedTableFooter className="px-4 pb-4" {...customerListPag.footerProps} />
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {customerListPag.pagedItems.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/50 bg-card p-4 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary">{c.id}</p>
                    <p className="font-semibold text-card-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.contact}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(c)} aria-label="Sửa"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCustomer(c)} aria-label="Sửa"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeletingCustomer(c)} aria-label="Xóa"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</div>
                  <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{c.address}</div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Tổng HĐ: <span className="font-semibold text-card-foreground">{c.contracts}</span></span>
                  {c.activeContracts > 0 && <Badge variant="default">{c.activeContracts} đang TH</Badge>}
                </div>
              </div>
            ))}
          </div>
          <PaginatedTableFooter className="md:hidden mt-2" {...customerListPag.footerProps} />
        </TabsContent>

        {/* ---------------- Loyalty ---------------- */}
        <TabsContent value="loyalty" className="mt-4 space-y-4">
          {/* Tier summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(tierMeta) as Tier[]).map((t) => {
              const Icon = tierMeta[t].icon;
              const count = customers.filter((c) => getTier(c.contracts) === t).length;
              return (
                <div key={t} className={`rounded-xl border p-4 ${tierMeta[t].cls}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Hạng {t}</span>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                  <p className="text-xs opacity-80">khách hàng</p>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="rounded-xl border border-border/50 bg-card">
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className="text-sm font-semibold text-card-foreground">Bảng xếp hạng theo số hợp đồng</h3>
              <p className="text-xs text-muted-foreground">Tổng cộng {totalContracts} hợp đồng — quy đổi 1 HĐ = 100 điểm</p>
            </div>
            <div className="divide-y divide-border/50">
              {[...customers].sort((a, b) => b.contracts - a.contracts).map((c, idx) => {
                const tier = getTier(c.contracts);
                const next = nextTierThreshold(tier);
                const progress = next ? Math.min(100, (c.contracts / next) * 100) : 100;
                const TierIcon = tierMeta[tier].icon;
                return (
                  <div key={c.id} className="flex items-center gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-card-foreground truncate">{c.name}</p>
                        <Badge variant="outline" className={`gap-1 ${tierMeta[tier].cls}`}>
                          <TierIcon className="h-3 w-3" />{tier}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground shrink-0">
                          {next ? `${c.contracts}/${next}` : `${c.contracts} HĐ`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-card-foreground">{c.contracts * 100}</p>
                      <p className="text-[10px] text-muted-foreground">điểm</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEditLoyalty(c)} aria-label="Sửa loyalty">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <Dialog open={!!editingLoyalty} onOpenChange={(o) => !o && setEditingLoyalty(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Chỉnh sửa Loyalty — {editingLoyalty?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Số hợp đồng (quyết định hạng)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loyaltyContracts}
                    onChange={(e) => setLoyaltyContracts(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hạng hiện tại: <span className="font-medium text-foreground">{getTier(Math.max(0, Math.floor(loyaltyContracts || 0)))}</span>
                    {" • "}Điểm: <span className="font-medium text-foreground">{Math.max(0, Math.floor(loyaltyContracts || 0)) * 100}</span>
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditingLoyalty(null)}>Hủy</Button>
                  <Button onClick={handleSaveLoyalty}>Lưu</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <CustomerDetailDialog
        customer={editingCustomer}
        open={!!editingCustomer}
        mode="edit"
        onSave={handleSave}
        onOpenChange={(o) => !o && setEditingCustomer(null)}
      />

      <AlertDialog open={!!deletingCustomer} onOpenChange={(o) => !o && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn vị <span className="font-medium text-foreground">{deletingCustomer?.name}</span> ({deletingCustomer?.id}) sẽ được đánh dấu xóa mềm. Bạn có chắc chắn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmDeleteCustomer()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const KpiCard = ({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "success" | "warning" | "info" }) => {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info:    "bg-info/10 text-info",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border/50">
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneCls}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold text-card-foreground">{value}</p>
      </div>
    </div>
  );
};

export default Customers;
