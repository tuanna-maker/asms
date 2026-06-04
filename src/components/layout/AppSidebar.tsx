import {
  LayoutDashboard,
  FileText,
  Truck,
  Wrench,
  Package,
  Boxes,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  FolderOpen,
  Workflow,
  MessageSquareWarning,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { useSidebarBadges, type SidebarBadges } from "@/hooks/use-sidebar-badges";

type BadgeKey = keyof SidebarBadges;

const menuItems: Array<{
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badge?: BadgeKey;
}> = [
  { icon: LayoutDashboard, label: "Bảng điều khiển", path: "/" },
  { icon: FileText, label: "Hợp đồng", path: "/hop-dong", badge: "overdueContracts" },
  { icon: Truck, label: "Bàn giao & HL", path: "/ban-giao", badge: "overdueHandovers" },
  { icon: Wrench, label: "Bảo hành / SC", path: "/bao-hanh", badge: "openWarranties" },
  { icon: Boxes, label: "Sản phẩm", path: "/san-pham" },
  { icon: Package, label: "Vật tư", path: "/vat-tu" },
  { icon: Users, label: "Khách hàng", path: "/khach-hang" },
  { icon: MessageSquareWarning, label: "Phản ánh", path: "/phan-anh" },
  { icon: BarChart3, label: "Báo cáo", path: "/bao-cao" },
  { icon: FolderOpen, label: "Tài liệu", path: "/tai-lieu" },
  { icon: Workflow, label: "Quy trình", path: "/quy-trinh" },
  { icon: Settings, label: "Cài đặt", path: "/cai-dat" },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const AppSidebar = ({ onNavigate }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useRole();
  const visibleItems = menuItems.filter((m) => canAccess(m.path));
  const { data: badges } = useSidebarBadges();

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  // When used inside Sheet (mobile), always show expanded
  const isInSheet = !!onNavigate;
  const isCollapsed = isInSheet ? false : collapsed;

  return (
    <aside
      className={`flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        isInSheet ? "w-full" : isCollapsed ? "w-[68px]" : "w-60"
      }`}
    >
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          ERP
        </div>
        {!isCollapsed && <span className="font-semibold text-sidebar-primary-foreground text-lg">Hệ thống ASMS</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = item.badge ? badges?.[item.badge] ?? 0 : 0;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <span className="relative shrink-0">
                <item.icon className="h-5 w-5" />
                {badgeCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground shadow">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </span>
              {!isCollapsed && (
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-1.5 text-[10px] font-medium text-destructive">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {!isInSheet && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      )}
    </aside>
  );
};

export default AppSidebar;
