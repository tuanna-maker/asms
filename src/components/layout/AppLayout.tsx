import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import AppSidebar from "./AppSidebar";
import BottomNav from "./BottomNav";
import { useAuth } from "@/hooks/use-auth";
import { useNotificationToast } from "@/hooks/use-notification-toast";
import DashboardHeader from "../dashboard/DashboardHeader";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Tổng quan hệ thống ERP" },
  "/hop-dong": { title: "Quản lý hợp đồng", subtitle: "Danh sách và theo dõi tiến độ hợp đồng" },
  "/ban-giao": { title: "Bàn giao & Huấn luyện", subtitle: "Quản lý bàn giao và huấn luyện sản phẩm" },
  "/bao-hanh": { title: "Bảo hành / Sửa chữa", subtitle: "Tiếp nhận và xử lý yêu cầu bảo hành, sửa chữa" },
  "/vat-tu": { title: "Quản lý vật tư", subtitle: "Nhập, xuất và điều chuyển vật tư" },
  "/khach-hang": { title: "Khách hàng", subtitle: "Quản lý thông tin khách hàng" },
  "/phan-anh": { title: "Phản ánh", subtitle: "Danh sách phản ánh khách hàng toàn hệ thống" },
  "/bao-cao": { title: "Báo cáo & Thống kê", subtitle: "Báo cáo theo khách hàng, hợp đồng, sản phẩm" },
  "/quy-trinh": { title: "Quy trình", subtitle: "Cấu hình luồng xử lý theo từng module nghiệp vụ" },
  "/cai-dat": { title: "Cài đặt", subtitle: "Quản lý người dùng và phân quyền" },
  "/thong-bao": { title: "Thông báo", subtitle: "Danh sách thông báo trong ứng dụng" },
};

const AppLayout = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const page = pageTitles[location.pathname] || { title: "ERP", subtitle: "" };
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useNotificationToast(isAuthenticated);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      {!isMobile && <AppSidebar />}

      {/* Mobile sidebar as Sheet (opened via hamburger or "Thêm" bottom nav) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-60">
            <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DashboardHeader
          title={page.title}
          subtitle={page.subtitle}
          onMenuClick={isMobile ? () => setSidebarOpen(true) : undefined}
        />
        <main className={`flex-1 overflow-y-auto p-3 sm:p-6 ${isMobile ? "pb-[72px]" : ""}`}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <BottomNav onMoreClick={() => setSidebarOpen(true)} />}
    </div>
  );
};

export default AppLayout;
