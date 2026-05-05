import {
  LayoutDashboard,
  FileText,
  Truck,
  Wrench,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileText, label: "Hợp đồng" },
  { icon: Truck, label: "Bàn giao & HL" },
  { icon: Wrench, label: "Bảo hành / SC" },
  { icon: Package, label: "Vật tư" },
  { icon: Users, label: "Khách hàng" },
  { icon: BarChart3, label: "Báo cáo" },
  { icon: Settings, label: "Cài đặt" },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
          ERP
        </div>
        {!collapsed && <span className="font-semibold text-sidebar-primary-foreground text-lg">ERP System</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              item.active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
      >
        <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </aside>
  );
};

export default Sidebar;
