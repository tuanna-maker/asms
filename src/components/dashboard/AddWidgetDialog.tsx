import { useState } from "react";
import { Plus, BarChart3, PieChart as PieChartIcon, TrendingUp, Activity, Package, FileText, Shield, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface WidgetTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: string;
  defaultSize: { w: number; h: number };
}

interface AddWidgetDialogProps {
  open: boolean;
  onClose: () => void;
  templates: WidgetTemplate[];
  existingWidgetIds: string[];
  onAdd: (templateId: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  "Biểu đồ": BarChart3,
  "Tiến độ": Activity,
  "Sản phẩm": Package,
  "Hợp đồng": FileText,
  "Bảo hành": Shield,
  "Vật tư": Wallet,
  "Tổng hợp": TrendingUp,
};

const AddWidgetDialog = ({ open, onClose, templates, existingWidgetIds, onAdd }: AddWidgetDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  const filtered = selectedCategory === "all"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Thêm widget vào Dashboard
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "all" ? "Tất cả" : cat}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(template => {
            const exists = existingWidgetIds.includes(template.id);
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                className={`rounded-lg border p-4 transition-all ${
                  exists
                    ? "border-border/30 opacity-50"
                    : "border-border hover:border-primary/50 hover:shadow-md cursor-pointer"
                }`}
                onClick={() => { if (!exists) { onAdd(template.id); onClose(); } }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-card-foreground text-sm">{template.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">{template.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">{template.defaultSize.w}x{template.defaultSize.h}</span>
                      {exists && <Badge variant="outline" className="text-[10px]">Đã thêm</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWidgetDialog;
