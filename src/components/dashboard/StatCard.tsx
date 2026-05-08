import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "primary" | "success" | "warning" | "destructive" | "info" | "accent";
  subtitle?: string;
}

const colorMap = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  accent: "bg-accent/10 text-accent",
};

const StatCard = ({ title, value, icon: Icon, color, subtitle }: StatCardProps) => {
  return (
    <div className="flex items-center gap-3 sm:gap-4 rounded-xl bg-card p-4 sm:p-5 shadow-sm border border-border/50">
      <div className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-card-foreground leading-tight mt-0.5">{value}</p>
        {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
