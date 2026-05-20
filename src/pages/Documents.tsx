import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCreateDocument, useDeleteDocument, useUpdateDocument } from "@/hooks/use-documents-api";
import { FolderOpen, Plus, Search, FileText, Download, Edit, Trash2, File, FileImage, FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useListPagination } from "@/hooks/use-list-pagination";
import ListPaginationBar from "@/components/ui/ListPaginationBar";

interface DocItem {
  id: string;
  name: string;
  category: "contract" | "technical" | "policy" | "training" | "report" | "other";
  fileType: "pdf" | "doc" | "xls" | "img" | "other";
  size: string;
  owner: string;
  uploadedAt: string;
  tags: string[];
  description?: string;
}


const catLabel = { contract: "Hợp đồng", technical: "Kỹ thuật", policy: "Chính sách", training: "Đào tạo", report: "Báo cáo", other: "Khác" };
const catColor = {
  contract: "bg-primary/10 text-primary",
  technical: "bg-info/10 text-info",
  policy: "bg-warning/10 text-warning",
  training: "bg-success/10 text-success",
  report: "bg-accent text-accent-foreground",
  other: "bg-muted text-muted-foreground",
};

const fileIcon = (t: DocItem["fileType"]) => {
  const cls = "h-8 w-8";
  if (t === "pdf") return <FileText className={`${cls} text-destructive`} />;
  if (t === "doc") return <FileText className={`${cls} text-primary`} />;
  if (t === "xls") return <FileSpreadsheet className={`${cls} text-success`} />;
  if (t === "img") return <FileImage className={`${cls} text-info`} />;
  return <File className={`${cls} text-muted-foreground`} />;
};

const Documents = () => {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<DocItem, "id" | "uploadedAt"> & { tagsInput: string }>({
    name: "", category: "other", fileType: "pdf", size: "", owner: "", tags: [], tagsInput: "", description: "",
  });

  type ApiSuccess<T> = { success: true; data: T; message?: string };
  type ApiDocRow = {
    code: string;
    name: string;
    category: DocItem["category"];
    fileType: DocItem["fileType"];
    fileSize: string | null;
    tags: string[];
    description: string | null;
    uploadedAt: string;
    owner: { fullName: string } | null;
    ownerId: string | null;
  };

  const { data: apiDocs } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiDocRow[]>>("/api/v1/documents");
      const rows = res.data.data ?? [];
      return rows.map((row) => ({
        id: row.code,
        name: row.name,
        category: row.category,
        fileType: row.fileType,
        size: row.fileSize ?? "",
        owner: row.owner?.fullName ?? row.ownerId ?? "",
        uploadedAt: new Date(row.uploadedAt).toISOString().slice(0, 10),
        tags: row.tags ?? [],
        description: row.description ?? undefined,
      }));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!apiDocs) return;
    setDocs(apiDocs);
  }, [apiDocs]);

  const createDocumentMutation = useCreateDocument();
  const updateDocumentMutation = useUpdateDocument();
  const deleteDocumentMutation = useDeleteDocument();

  const stats = {
    total: docs.length,
    contracts: docs.filter(d => d.category === "contract").length,
    technical: docs.filter(d => d.category === "technical").length,
    reports: docs.filter(d => d.category === "report").length,
  };

  const filtered = useMemo(
    () =>
      docs.filter((d) => {
        if (tab !== "all" && d.category !== tab) return false;
        if (search) {
          const s = search.toLowerCase();
          if (!d.name.toLowerCase().includes(s) && !d.tags.some((t) => t.toLowerCase().includes(s))) return false;
        }
        return true;
      }),
    [docs, tab, search],
  );

  const {
    pagedItems: pagedDocs,
    page: docPage,
    setPage: setDocPage,
    totalPages: docTotalPages,
    total: docTotal,
    pageSize: docPageSize,
  } = useListPagination(filtered, { resetDeps: [search, tab] });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", category: "other", fileType: "pdf", size: "", owner: "", tags: [], tagsInput: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (d: DocItem) => {
    setEditingId(d.id);
    setForm({ name: d.name, category: d.category, fileType: d.fileType, size: d.size, owner: d.owner, tags: d.tags, tagsInput: d.tags.join(", "), description: d.description });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.owner) {
      toast.error("Vui lòng điền tên tài liệu và người tạo");
      return;
    }
    const tags = form.tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    try {
      if (editingId) {
        await updateDocumentMutation.mutateAsync({
          id: editingId,
          payload: {
            name: form.name,
            categoryCode: form.category,
            fileType: form.fileType,
            fileSize: form.size || undefined,
            tags,
            description: form.description,
          },
        });
        toast.success("Đã cập nhật tài liệu");
      } else {
        await createDocumentMutation.mutateAsync({
          name: form.name,
          categoryCode: form.category,
          fileType: form.fileType,
          fileSize: form.size || undefined,
          tags,
          description: form.description,
        });
        toast.success("Đã tải lên tài liệu");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Không thể lưu tài liệu");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDocumentMutation.mutateAsync(deletingId);
      toast.success("Đã xóa tài liệu");
      setDeletingId(null);
    } catch {
      toast.error("Không thể xóa tài liệu");
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" /> Tài liệu
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Kho tài liệu chung của toàn hệ thống</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Upload className="h-4 w-4" /> Tải lên</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FolderOpen className="h-5 w-5 text-primary" /></div><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Tổng tài liệu</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div><div><div className="text-2xl font-bold">{stats.contracts}</div><div className="text-xs text-muted-foreground">Hợp đồng</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-info/10"><FileText className="h-5 w-5 text-info" /></div><div><div className="text-2xl font-bold">{stats.technical}</div><div className="text-xs text-muted-foreground">Kỹ thuật</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><FileSpreadsheet className="h-5 w-5 text-success" /></div><div><div className="text-2xl font-bold">{stats.reports}</div><div className="text-xs text-muted-foreground">Báo cáo</div></div></div></Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm theo tên hoặc tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="contract">Hợp đồng</TabsTrigger>
            <TabsTrigger value="technical">Kỹ thuật</TabsTrigger>
            <TabsTrigger value="policy">Chính sách</TabsTrigger>
            <TabsTrigger value="training">Đào tạo</TabsTrigger>
            <TabsTrigger value="report">Báo cáo</TabsTrigger>
            <TabsTrigger value="other">Khác</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Không có tài liệu nào</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pagedDocs.map((d) => (
                  <Card key={d.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">{fileIcon(d.fileType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-primary">{d.id}</span>
                          <Badge className={`text-xs ${catColor[d.category]} border-0`}>{catLabel[d.category]}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm truncate" title={d.name}>{d.name}</h3>
                        <div className="text-xs text-muted-foreground mt-1">
                          {d.size} · {d.owner} · {d.uploadedAt}
                        </div>
                        {d.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {d.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">#{t}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                      <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeletingId(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            <ListPaginationBar
              className="mt-4"
              page={docPage}
              totalPages={docTotalPages}
              totalItems={docTotal}
              pageSize={docPageSize}
              onPageChange={setDocPage}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Chỉnh sửa tài liệu" : "Tải lên tài liệu mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên tài liệu *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Quy trình bảo hành.pdf" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v: DocItem["category"]) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Hợp đồng</SelectItem>
                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                    <SelectItem value="policy">Chính sách</SelectItem>
                    <SelectItem value="training">Đào tạo</SelectItem>
                    <SelectItem value="report">Báo cáo</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Loại file</Label>
                <Select value={form.fileType} onValueChange={(v: DocItem["fileType"]) => setForm({ ...form, fileType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="doc">Word</SelectItem>
                    <SelectItem value="xls">Excel</SelectItem>
                    <SelectItem value="img">Hình ảnh</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Kích thước</Label><Input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="VD: 2.4 MB" /></div>
              <div><Label>Người tạo *</Label><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></div>
            </div>
            <div><Label>Tags (cách nhau bởi dấu phẩy)</Label><Input value={form.tagsInput} onChange={(e) => setForm({ ...form, tagsInput: e.target.value })} placeholder="VD: hợp đồng, 2025" /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editingId ? "Cập nhật" : "Tải lên"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tài liệu?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
