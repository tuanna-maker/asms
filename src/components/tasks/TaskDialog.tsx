import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save, Trash2 } from "lucide-react";
import type { TaskItem } from "@/data/taskData2";
import { taskTypeLabels, statusLabels, priorityLabels } from "@/data/taskData2";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Partial<TaskItem>) => void;
  editTask?: TaskItem | null;
  onDelete?: () => void;
}

const TaskDialog = ({ open, onOpenChange, onSave, editTask, onDelete }: TaskDialogProps) => {
  const [form, setForm] = useState({
    title: "", description: "", priority: "medium" as TaskItem["priority"],
    assignee: "", startDate: "", deadline: "",
    status: "todo" as TaskItem["status"], progress: 0,
    type: "research" as TaskItem["type"], projectCode: "",
  });

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title, description: editTask.description,
        priority: editTask.priority, assignee: editTask.assignee,
        startDate: editTask.startDate, deadline: editTask.deadline,
        status: editTask.status, progress: editTask.progress,
        type: editTask.type, projectCode: editTask.projectCode || "",
      });
    } else {
      setForm({ title: "", description: "", priority: "medium", assignee: "", startDate: "", deadline: "", status: "todo", progress: 0, type: "research", projectCode: "" });
    }
  }, [editTask, open]);

  const handleSubmit = () => {
    if (!form.title) return;
    const finalProgress = form.status === "completed" ? 100 : form.progress;
    onSave({ ...form, progress: finalProgress });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}</DialogTitle>
          {editTask?.code ? (
            <p className="text-xs text-muted-foreground font-mono">Mã: {editTask.code}</p>
          ) : null}
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Tiêu đề *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ưu tiên</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskItem["priority"] }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Loại</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as TaskItem["type"] }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(taskTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {editTask && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Trạng thái</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TaskItem["status"] }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tiến độ</Label>
                  <span className="text-xs font-mono text-primary">{form.progress}%</span>
                </div>
                <Slider value={[form.progress]} onValueChange={v => setForm(f => ({ ...f, progress: v[0] }))} max={100} step={5} className="mt-2" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Người thực hiện</Label>
            <Input value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Ngày bắt đầu</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hạn hoàn thành</Label>
              <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mô tả</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="text-sm resize-none" />
          </div>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:gap-2 gap-2">
          <div className="flex w-full sm:w-auto gap-2">
            {editTask && onDelete ? (
              <Button type="button" variant="destructive" className="gap-1.5" onClick={() => onDelete()}>
                <Trash2 className="w-3.5 h-3.5" />
                Xóa
              </Button>
            ) : <span />}
          </div>
          <div className="flex w-full sm:w-auto justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleSubmit} className="gap-1.5">
              <Save className="w-3.5 h-3.5" />
              {editTask ? "Lưu" : "Tạo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
