import { NavLink } from "react-router-dom";
import { List, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { feedbackPaths } from "@/lib/feedback-routes";

const items = [
  { to: feedbackPaths.list, label: "Danh sách", icon: List, end: true },
  { to: feedbackPaths.statistics, label: "Thống kê", icon: PieChart, end: false },
] as const;

export function FeedbackModuleNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        "flex flex-wrap gap-1 rounded-lg border border-border/50 bg-secondary/30 p-1",
        className,
      )}
      aria-label="Phản ánh"
    >
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
