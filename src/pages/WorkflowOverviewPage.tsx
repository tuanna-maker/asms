import { ChevronRight, Cpu, GraduationCap, Truck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { useWorkflowsList, type WorkflowModuleKey } from "@/hooks/use-workflows-api";
import { isWorkflowModuleHidden } from "@/lib/workflow-visibility";

const MODULES: Array<{
  key: WorkflowModuleKey;
  label: string;
  description: string;
  icon: typeof Truck;
  iconClassName: string;
}> = [
  {
    key: "handover",
    label: "Bàn giao",
    description: "Quy trình lập phiếu và phê duyệt bàn giao thiết bị.",
    icon: Truck,
    iconClassName: "bg-orange-500/15 text-orange-600",
  },
  {
    key: "training",
    label: "Đào tạo",
    description: "Quy trình tổ chức và phê duyệt khoá đào tạo (3 bước).",
    icon: GraduationCap,
    iconClassName: "bg-violet-500/15 text-violet-600",
  },
  {
    key: "coaching",
    label: "Huấn luyện",
    description: "Quy trình huấn luyện gắn hợp đồng / bàn giao (3 bước).",
    icon: GraduationCap,
    iconClassName: "bg-indigo-500/15 text-indigo-600",
  },
  {
    key: "warranty",
    label: "Bảo hành",
    description: "Quy trình tiếp nhận và xử lý yêu cầu bảo hành / sửa chữa.",
    icon: Wrench,
    iconClassName: "bg-rose-500/15 text-rose-600",
  },
  {
    key: "product",
    label: "Sản phẩm",
    description: "Quy trình sản xuất, nghiệm thu cấp Bộ và đưa vào trang bị.",
    icon: Cpu,
    iconClassName: "bg-emerald-500/15 text-emerald-600",
  },
];

const WorkflowOverviewPage = () => {
  const { data: workflows = [], isLoading } = useWorkflowsList();

  const countByModule = workflows.reduce<Record<string, number>>((acc, w) => {
    acc[w.moduleKey] = (acc[w.moduleKey] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm divide-y divide-border/50">
      {MODULES.filter((m) => !isWorkflowModuleHidden(m.key)).map((m) => {
        const Icon = m.icon;
        return (
          <Link
            key={m.key}
            to={`/quy-trinh/${m.key}`}
            className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-secondary/30 sm:px-5"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${m.iconClassName}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-card-foreground">{m.label}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">{m.description}</p>
            </div>
            <span className="hidden shrink-0 text-sm text-muted-foreground sm:block sm:min-w-[7rem] sm:text-right">
              {isLoading ? "Đang tải…" : `${countByModule[m.key] ?? 0} quy trình`}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        );
      })}
    </div>
  );
};

export default WorkflowOverviewPage;
