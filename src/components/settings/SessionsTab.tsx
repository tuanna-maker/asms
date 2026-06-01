import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";

import { Badge } from "@/components/ui/badge";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useLogoutAll,
  useRevokeSession,
  useSessions,
  type SessionItem,
} from "@/hooks/use-sessions-api";

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function shortUA(ua: string | null) {
  if (!ua) return "—";
  if (ua.length <= 60) return ua;
  return `${ua.slice(0, 57)}…`;
}

type Props = { enabled: boolean };

export function SessionsTab({ enabled }: Props) {
  const { data: sessions = [], isLoading, isError, error, refetch, isFetching } = useSessions(enabled);
  const sessionsPag = usePaginatedSlice(sessions);
  const revoke = useRevokeSession();
  const logoutAll = useLogoutAll();

  const onRevoke = async (s: SessionItem) => {
    try {
      await revoke.mutateAsync(s.id);
      toast.success("Đã thu hồi phiên");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onLogoutAll = async () => {
    try {
      const res = await logoutAll.mutateAsync();
      toast.success(`Đã đăng xuất ${(res as unknown as { data?: { data?: { count?: number } } }).data?.data?.count ?? ""} phiên`.trim());
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border/50">
        <div>
          <h3 className="font-semibold text-card-foreground">Phiên đăng nhập</h3>
          <p className="text-xs text-muted-foreground">
            Mỗi thiết bị / trình duyệt là một phiên. Đăng xuất tất cả sẽ thu hồi phiên còn lại, giữ phiên hiện tại.
          </p>
        </div>
        <div className="space-x-2">
          <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            {isFetching ? "Đang tải…" : "Làm mới"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => void onLogoutAll()} disabled={logoutAll.isPending}>
            {logoutAll.isPending ? "Đang xử lý…" : "Đăng xuất tất cả thiết bị khác"}
          </Button>
        </div>
      </div>
      {isError ? (
        <div className="p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được danh sách phiên."}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Thiết bị / User-Agent</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Tạo lúc</TableHead>
            <TableHead>Hoạt động cuối</TableHead>
            <TableHead>Hết hạn</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Đang tải…</TableCell>
            </TableRow>
          ) : sessions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có phiên đang hoạt động.</TableCell>
            </TableRow>
          ) : (
            sessionsPag.pagedItems.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="text-sm">
                  <div className="font-medium flex items-center gap-2">
                    {s.current ? <Badge>Hiện tại</Badge> : null}
                    {shortUA(s.userAgent)}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.ip ?? "—"}</TableCell>
                <TableCell className="text-xs">{formatDate(s.createdAt)}</TableCell>
                <TableCell className="text-xs">{formatDate(s.lastUsedAt)}</TableCell>
                <TableCell className="text-xs">{formatDate(s.expiresAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={s.current || revoke.isPending}
                    onClick={() => void onRevoke(s)}
                  >
                    Thu hồi
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <PaginatedTableFooter
        className="px-4 pb-4"
        {...sessionsPag.footerProps}
        disabled={isLoading || isFetching}
      />
    </div>
  );
}
