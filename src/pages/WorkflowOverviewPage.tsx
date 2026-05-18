import { ChevronRight, FileSignature, GraduationCap, Truck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkflowsList, type WorkflowModuleKey } from "@/hooks/use-workflows-api";

const MODULES: Array<{
  key: WorkflowModuleKey;
  label: string;
  description: string;
  icon: typeof Truck;
  iconClassName: string;
}> = [
  {
    key: "contract",
    label: "Hợp đồng (tổng hợp)",
    description: "Quy trình thống nhất gắn theo hợp đồng cho mọi giai đoạn.",
    icon: FileSignature,
    iconClassName: "bg-primary/15 text-primary",
  },
  {
    key: "handover",
    label: "Bàn giao",
    description: "Quy trình lập phiếu và phê duyệt bàn giao thiết bị.",
    icon: Truck,
    iconClassName: "bg-orange-500/15 text-orange-600",
  },
  {
    key: "warranty",
    label: "Bảo hành",
    description: "Quy trình tiếp nhận và xử lý yêu cầu bảo hành / sửa chữa.",
    icon: Wrench,
    iconClassName: "bg-rose-500/15 text-rose-600",
  },
  {
    key: "training",
    label: "Huấn luyện",
    description: "Quy trình tổ chức và phê duyệt khoá huấn luyện.",
    icon: GraduationCap,
    iconClassName: "bg-violet-500/15 text-violet-600",
  },
];

const WorkflowOverviewPage = () => {
  const { data: workflows = [], isLoading } = useWorkflowsList();

  const countByModule = workflows.reduce<Record<string, number>>((acc, w) => {
    acc[w.moduleKey] = (acc[w.moduleKey] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.key}
              to={`/quy-trinh/${m.key}`}
              className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-5 shadow-sm transition-colors hover:bg-secondary/30"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${m.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-card-foreground">{m.label}</h3>
                    <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {isLoading ? "Đang tải…" : `${countByModule[m.key] ?? 0} quy trình`}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowOverviewPage;
