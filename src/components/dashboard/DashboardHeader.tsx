import { Bell, Search, User, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import RoleSwitcher from "@/components/layout/RoleSwitcher";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

const DashboardHeader = ({ title = "Dashboard", subtitle = "Tổng quan hệ thống ERP", onMenuClick }: DashboardHeaderProps) => {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 sm:h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-6 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-card-foreground truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="h-9 w-48 lg:w-64 rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="hidden sm:block">
          <RoleSwitcher />
        </div>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Toggle theme">
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
