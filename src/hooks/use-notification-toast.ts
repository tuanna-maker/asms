import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useUnreadNotificationsCount, DEFAULT_POLL_MS } from "@/hooks/use-notifications-api";

const TOAST_DEBOUNCE_MS = 30_000;

/** Hiện toast khi số thông báo chưa đọc tăng (polling). */
export function useNotificationToast(enabled: boolean) {
  const { data: count = 0 } = useUnreadNotificationsCount(enabled, {
    refetchInterval: DEFAULT_POLL_MS,
  });
  const prevCountRef = useRef<number | null>(null);
  const lastToastAtRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (prev === null) return;
    if (count <= prev) return;
    const now = Date.now();
    if (now - lastToastAtRef.current < TOAST_DEBOUNCE_MS) return;
    lastToastAtRef.current = now;
    const delta = count - prev;
    toast.info(delta === 1 ? "Bạn có 1 thông báo mới" : `Bạn có ${delta} thông báo mới`);
  }, [count, enabled]);
}
