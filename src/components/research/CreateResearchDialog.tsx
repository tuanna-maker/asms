import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ResearchProject } from "@/data/researchData";

interface CreateResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (project: Partial<ResearchProject>) => void | Promise<void>;
  editProject?: ResearchProject | null;
}

const CreateResearchDialog = ({ open, onOpenChange, onSave, editProject }: CreateResearchDialogProps) => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    manager: "",
    department: "",
    fundingSource: "",
    startDate: "",
    endDate: "",
    status: "planning" as ResearchProject["status"],
    description: "",
    progress: 0,
  });

  useEffect(() => {
    if (editProject) {
      setForm({
        code: editProject.code,
        name: editProject.name,
        manager: editProject.manager,
        department: editProject.department,
        fundingSource: editProject.fundingSource,
        startDate: editProject.startDate,
        endDate: editProject.endDate,
        status: editProject.status,
        description: editProject.description,
        progress: editProject.progress,
      });
    } else {
      setForm({ code: "", name: "", manager: "", department: "", fundingSource: "", startDate: "", endDate: "", status: "planning", description: "", progress: 0 });
    }
  }, [editProject, open]);

  const handleSubmit = async () => {
    if (!form.name || !form.code) return;
    await Promise.resolve(
      onSave({
        ...form,
        members: editProject?.members || [form.manager],
        tasks: editProject?.tasks || [],
        deliverables: editProject?.deliverables || [],
        budget: editProject?.budget || 0,
        budgetSpent: editProject?.budgetSpent || 0,
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProject ? "Chỉnh sửa đề tài" : "Thêm đề tài mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mã đề tài *</Label>
              <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="NCKH.DL.2025.xx" className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Trạng thái</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ResearchProject["status"] }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Kế hoạch</SelectItem>
                  <SelectItem value="active">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="suspended">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tên đề tài *</Label>
            <Textarea value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên đề tài nghiên cứu..." rows={2} className="text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Chủ nhiệm</Label>
              <Input value={form.manager} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Đơn vị</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nguồn kinh phí</Label>
            <Input value={form.fundingSource} onChange={e => setForm(f => ({ ...f, fundingSource: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ngày bắt đầu</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ngày kết thúc</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tiến độ (%)</Label>
            <Input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mô tả</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="text-sm resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => void handleSubmit()}>{editProject ? "Lưu thay đổi" : "Tạo đề tài"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateResearchDialog;
