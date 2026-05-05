import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Calendar, Users, Clock, CheckCircle, Search, Edit, Trash2, Eye } from "lucide-react";
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
import { api } from "@/lib/api";
import { TrainingCourse, typeLabel, statusLabel, statusColor } from "@/data/trainingData";
import { useTrainingCourses } from "@/hooks/use-training";
import { buildTrainingCoursePayload } from "@/lib/training-payload";

const Training = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const courses = useTrainingCourses();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TrainingCourse, "id">>({
    title: "", type: "internal", instructor: "", customer: "",
    startDate: "", endDate: "", participants: 0, status: "planned", description: "",
  });

  const stats = {
    total: courses.length,
    ongoing: courses.filter(c => c.status === "ongoing").length,
    completed: courses.filter(c => c.status === "completed").length,
    participants: courses.reduce((s, c) => s + c.participants, 0),
  };

  const filtered = courses.filter(c => {
    if (tab !== "all" && c.status !== tab) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", type: "internal", instructor: "", customer: "", startDate: "", endDate: "", participants: 0, status: "planned", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: TrainingCourse) => {
    setEditingId(c.id);
    const { id, trainees, schedule, ...rest } = c;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.instructor || !form.startDate) {
      toast.error("Vui lòng điền tiêu đề, giảng viên và ngày bắt đầu");
      return;
    }
    const payload = buildTrainingCoursePayload(form);
    try {
      if (editingId) {
        await api.put(`/api/v1/training/${editingId}`, payload);
        toast.success("Đã cập nhật khóa đào tạo");
      } else {
        await api.post("/api/v1/training", payload);
        toast.success("Đã tạo khóa đào tạo mới");
      }
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      if (editingId) {
        await qc.invalidateQueries({ queryKey: ["trainingCourse", editingId] });
      }
      setDialogOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể lưu khóa đào tạo";
      toast.error(msg);
      return;
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/training/${deletingId}`);
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      await qc.invalidateQueries({ queryKey: ["trainingCourse", deletingId] });
      toast.success("Đã xóa khóa đào tạo");
      setDeletingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể xóa khóa đào tạo";
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Đào tạo & Huấn luyện
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý khóa học, huấn luyện nội bộ và khách hàng</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Tạo khóa mới</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><GraduationCap className="h-5 w-5 text-primary" /></div><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Tổng khóa</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div><div><div className="text-2xl font-bold">{stats.ongoing}</div><div className="text-xs text-muted-foreground">Đang diễn ra</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div><div><div className="text-2xl font-bold">{stats.completed}</div><div className="text-xs text-muted-foreground">Hoàn thành</div></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-info/10"><Users className="h-5 w-5 text-info" /></div><div><div className="text-2xl font-bold">{stats.participants}</div><div className="text-xs text-muted-foreground">Học viên</div></div></div></Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm khóa đào tạo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="planned">Kế hoạch</TabsTrigger>
            <TabsTrigger value="ongoing">Đang TH</TabsTrigger>
            <TabsTrigger value="completed">Xong</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Không có khóa đào tạo nào</div>
            ) : filtered.map((c) => (
              <Card
                key={c.id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/dao-tao/${c.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-primary">{c.id}</span>
                      <Badge variant="outline" className="text-xs">{typeLabel[c.type]}</Badge>
                      <Badge className={`text-xs ${statusColor[c.status]} border-0`}>{statusLabel[c.status]}</Badge>
                    </div>
                    <h3 className="font-semibold truncate">{c.title}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                      <div>👨‍🏫 GV: {c.instructor}</div>
                      <div>🎯 KH: {c.customer}</div>
                      <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.startDate} → {c.endDate}</div>
                      <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.participants} học viên</div>
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" onClick={() => navigate(`/dao-tao/${c.id}`)} title="Xem chi tiết"><Eye className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeletingId(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Chỉnh sửa khóa đào tạo" : "Tạo khóa đào tạo mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tiêu đề *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Loại</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="internal">Nội bộ</SelectItem><SelectItem value="external">Khách hàng</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="planned">Kế hoạch</SelectItem><SelectItem value="ongoing">Đang TH</SelectItem><SelectItem value="completed">Hoàn thành</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Giảng viên *</Label><Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></div>
              <div><Label>Khách hàng / Đơn vị</Label><Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ngày bắt đầu *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>Ngày kết thúc</Label><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Số học viên</Label><Input type="number" value={form.participants} onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })} /></div>
            <div><Label>Mô tả</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>{editingId ? "Cập nhật" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khóa đào tạo?</AlertDialogTitle>
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

export default Training;
