import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
  type NotificationItem,
} from "@/hooks/use-notifications-api";

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState<"all" | "unread">("all");
  const { data: count = 0 } = useUnreadNotificationsCount(isAuthenticated);
  const { data: items = [], isLoading } = useNotifications(isAuthenticated, scope);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const onRowClick = async (item: NotificationItem) => {
    try {
      if (!item.readAt) await markRead.mutateAsync(item.id);
    } catch {
      // ignore
    }
    if (item.link) navigate(item.link);
  };

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Đã đánh dấu tất cả đã đọc");
    } catch {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Thông báo</h1>
            <p className="text-sm text-muted-foreground">
              {count > 0 ? `${count} chưa đọc` : "Không có thông báo chưa đọc"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={scope === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("all")}
          >
            Tất cả
          </Button>
          <Button
            variant={scope === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("unread")}
          >
            Chưa đọc
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!count || markAll.isPending}
            onClick={() => void onMarkAll()}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="w-24 text-right">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  {scope === "unread" ? "Không có thông báo chưa đọc." : "Chưa có thông báo."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer hover:bg-secondary/30 ${item.readAt ? "" : "bg-primary/5"}`}
                  onClick={() => void onRowClick(item)}
                >
                  <TableCell className="font-medium max-w-[240px]">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[320px] truncate">
                    {item.message ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatTime(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {item.readAt ? "Đã đọc" : "Mới"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
