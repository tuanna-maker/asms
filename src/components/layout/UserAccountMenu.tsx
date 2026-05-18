import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Moon, BookOpen, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import type { Role } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

const ROLE_SIDEBAR_LABEL: Record<Role, string> = {
  admin: "Quản trị viên hệ thống",
  manager: "Quản lý",
  technician: "Kỹ thuật viên",
  viewer: "Người xem",
  sales: "Nhân viên bán hàng",
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type UserAccountMenuProps = {
  /** Kích thước nút avatar (header mặc định nhỏ gọn) */
  size?: "sm" | "md";
  className?: string;
};

export function UserAccountMenu({ size = "sm", className }: UserAccountMenuProps) {
  const { user, logout } = useAuth();
  const { toggle } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!user) {
    return null;
  }

  const roleLabel = ROLE_SIDEBAR_LABEL[user.role];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const avatarClass =
    size === "md"
      ? "h-10 w-10 min-h-10 min-w-10 text-sm"
      : "h-9 w-9 min-h-9 min-w-9 text-xs";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-primary p-0 font-semibold text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
              avatarClass,
              className,
            )}
            aria-label="Tài khoản"
          >
            {initialsFromName(user.fullName)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={8}
          className="w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
        >
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg py-2.5 text-popover-foreground"
            onSelect={() => setProfileOpen(true)}
          >
            <User className="h-4 w-4 shrink-0" />
            Hồ sơ cá nhân
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg py-2.5 text-popover-foreground"
            onSelect={(e) => {
              e.preventDefault();
              toggle();
            }}
          >
            <Moon className="h-4 w-4 shrink-0" />
            Chế độ tối
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg py-2.5 text-popover-foreground"
            onSelect={() => setHelpOpen(true)}
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            Hướng dẫn sử dụng
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-border" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 rounded-lg py-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              void handleLogout();
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hồ sơ cá nhân</DialogTitle>
            <DialogDescription>Thông tin tài khoản đang đăng nhập.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initialsFromName(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Vai trò</span>
                <span className="font-medium text-foreground">{roleLabel}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hướng dẫn sử dụng</DialogTitle>
            <DialogDescription>Một số thao tác nhanh trong hệ thống.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Dùng menu bên trái để chuyển module; số trên icon là việc cần xử lý (nếu có).</li>
            <li>Chế độ sáng/tối: nút trăng/mặt trời trên thanh tiêu đề hoặc mục «Chế độ tối» trong menu tài khoản.</li>
            <li>Cài đặt → Người dùng: quản trị có thể thêm/sửa tài khoản (theo quyền).</li>
            <li>Đăng xuất an toàn qua mục «Đăng xuất» trong menu tài khoản.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
