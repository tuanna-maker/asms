import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import {
  FAST_POLL_MS,
  DEFAULT_POLL_MS,
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

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"all" | "unread">("all");
  const pollMs = open ? FAST_POLL_MS : DEFAULT_POLL_MS;

  const { data: count = 0 } = useUnreadNotificationsCount(isAuthenticated, { refetchInterval: pollMs });
  const { data: items = [], isLoading } = useNotifications(isAuthenticated, scope, {
    refetchInterval: open ? pollMs : DEFAULT_POLL_MS,
  });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const onItemClick = async (item: NotificationItem) => {
    try {
      if (!item.readAt) await markRead.mutateAsync(item.id);
    } catch {
      // ignore
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Đã đánh dấu đã đọc");
    } catch {
      toast.error("Không thể đánh dấu đã đọc");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5" />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-2 gap-2">
          <p className="text-sm font-semibold shrink-0">Thông báo</p>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={scope === "all" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setScope("all")}
            >
              Tất cả
            </Button>
            <Button
              type="button"
              variant={scope === "unread" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setScope("unread")}
            >
              Chưa đọc
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
          <Button variant="link" size="sm" className="h-7 text-xs px-0" asChild onClick={() => setOpen(false)}>
            <Link to="/thong-bao">Xem tất cả</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!count || markAll.isPending}
            onClick={() => void onMarkAll()}
            className="h-7 text-xs"
          >
            <CheckCheck className="h-3.5 w-3.5 mr-1" />
            Đánh dấu đã đọc
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {scope === "unread" ? "Không có thông báo chưa đọc." : "Chưa có thông báo."}
            </p>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void onItemClick(item)}
                className={`w-full text-left border-b border-border/40 last:border-b-0 px-3 py-2 hover:bg-secondary/30 ${item.readAt ? "" : "bg-primary/5"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-card-foreground line-clamp-2">{item.title}</p>
                  {!item.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                </div>
                {item.message ? (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                ) : null}
                <p className="text-[10px] text-muted-foreground mt-1">{formatTime(item.createdAt)}</p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
