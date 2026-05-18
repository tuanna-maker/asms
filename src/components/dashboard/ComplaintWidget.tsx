import { AlertTriangle, Shield, Wrench, Clock, CheckCircle } from "lucide-react";
import FullscreenWrapper from "./FullscreenWrapper";

interface ComplaintWidgetProps {
  total: number;
  warranty: number;
  repair: number;
  processing: number;
  done: number;
  onTime: number;
  late: number;
}

const ComplaintWidget = ({ total, warranty, repair, processing, done, onTime, late }: ComplaintWidgetProps) => {
  const stats = [
    { icon: Shield, label: "Bảo hành", value: warranty, color: "text-primary bg-primary/10" },
    { icon: Wrench, label: "Sửa chữa", value: repair, color: "text-accent bg-accent/10" },
    { icon: Clock, label: "Đang xử lý", value: processing, color: "text-warning bg-warning/10" },
    { icon: CheckCircle, label: "Hoàn thành", value: done, color: "text-success bg-success/10" },
  ];

  return (
    <FullscreenWrapper>
      <div className="rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50 h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Phản ánh & Khiếu nại</h3>
            <p className="text-xs text-muted-foreground">Tổng số: <span className="font-bold text-card-foreground">{total}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold text-card-foreground">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 sm:gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-success" />
            <span className="text-muted-foreground">Đúng hạn:</span>
            <span className="font-semibold text-card-foreground">{onTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Chậm tiến độ:</span>
            <span className="font-semibold text-destructive">{late}</span>
          </div>
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default ComplaintWidget;
