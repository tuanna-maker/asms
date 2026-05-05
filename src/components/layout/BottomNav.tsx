import { useLocation, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { LayoutDashboard, FileText, Wrench, Package, MoreHorizontal } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FileText, label: "Hợp đồng", path: "/hop-dong" },
  { icon: Wrench, label: "Bảo hành", path: "/bao-hanh" },
  { icon: Package, label: "Vật tư", path: "/vat-tu" },
];

interface BottomNavProps {
  onMoreClick: () => void;
}

const BottomNav = ({ onMoreClick }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useRole();
  const visibleNav = navItems.filter((item) => canAccess(item.path));
  const shortcutPaths = visibleNav.map((i) => i.path);

  const isMoreActive = !shortcutPaths.includes(location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {visibleNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onMoreClick}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
            isMoreActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MoreHorizontal className={`h-5 w-5 ${isMoreActive ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px] font-medium">Thêm</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
