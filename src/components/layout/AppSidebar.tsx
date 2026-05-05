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
  FlaskConical,
  ListTodo,
  GraduationCap,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileText, label: "Hợp đồng", path: "/hop-dong" },
  { icon: Truck, label: "Bàn giao & HL", path: "/ban-giao" },
  { icon: Wrench, label: "Bảo hành / SC", path: "/bao-hanh" },
  { icon: Boxes, label: "Sản phẩm", path: "/san-pham" },
  { icon: Package, label: "Vật tư", path: "/vat-tu" },
  { icon: Users, label: "CRM", path: "/khach-hang" },
  { icon: BarChart3, label: "Báo cáo", path: "/bao-cao" },
  { icon: FlaskConical, label: "Đề tài NC", path: "/de-tai" },
  { icon: ListTodo, label: "Công việc", path: "/cong-viec" },
  { icon: GraduationCap, label: "Đào tạo & HL", path: "/dao-tao" },
  { icon: FolderOpen, label: "Tài liệu", path: "/tai-lieu" },
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
        {!isCollapsed && <span className="font-semibold text-sidebar-primary-foreground text-lg">ERP System</span>}
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
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
