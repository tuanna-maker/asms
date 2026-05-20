import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLogs } from "@/hooks/use-audit-logs-api";

const ENTITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "user", label: "Người dùng" },
  { value: "role", label: "Vai trò" },
  { value: "definition", label: "Thuộc tính" },
  { value: "contract", label: "Hợp đồng" },
  { value: "handover", label: "Bàn giao" },
  { value: "warranty", label: "Bảo hành" },
  { value: "material", label: "Vật tư" },
  { value: "material_transfer", label: "Phiếu xuất vật tư" },
  { value: "system_setting", label: "Cấu hình hệ thống" },
  { value: "auth", label: "Đăng nhập / xuất" },
];

const ACTION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "create", label: "Tạo" },
  { value: "update", label: "Sửa" },
  { value: "delete", label: "Xoá" },
  { value: "reorder", label: "Sắp xếp" },
  { value: "login", label: "Đăng nhập" },
  { value: "logout", label: "Đăng xuất" },
  { value: "logout_all", label: "Đăng xuất tất cả" },
  { value: "session_revoke", label: "Thu hồi phiên" },
  { value: "settings_update", label: "Đổi cấu hình" },
];

const ACTION_BADGE: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  update: "bg-amber-500/10 text-amber-700 border-amber-500/40",
  delete: "bg-rose-500/10 text-rose-700 border-rose-500/40",
  login: "bg-sky-500/10 text-sky-700 border-sky-500/40",
  logout: "bg-slate-500/10 text-slate-700 border-slate-500/40",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "medium" });
}

type Props = { enabled: boolean; initialEntity?: string | null; initialEntityId?: string | null };

export function AuditLogsTab({ enabled, initialEntity, initialEntityId }: Props) {
  const [search, setSearch] = useState("");
  const [entity, setEntity] = useState(initialEntity ?? "all");
  const [entityId, setEntityId] = useState(initialEntityId ?? "");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (initialEntity) setEntity(initialEntity);
    if (initialEntityId) setEntityId(initialEntityId);
    if (initialEntity || initialEntityId) setPage(1);
  }, [initialEntity, initialEntityId]);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      entity: entity === "all" ? undefined : entity,
      entityId: entityId.trim() || undefined,
      action: action === "all" ? undefined : action,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize,
    }),
    [search, entity, entityId, action, from, to, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useAuditLogs(filters, enabled);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-semibold text-card-foreground">Nhật ký hoạt động</h3>
          <p className="text-xs text-muted-foreground">Truy vết hành động ghi (tạo/sửa/xoá) do người dùng thực hiện.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? "Đang tải…" : "Làm mới"}
        </Button>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-5">
        <div className="space-y-1">
          <Label className="text-xs">Tìm kiếm</Label>
          <Input
            placeholder="Tóm tắt / hành động"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Module</Label>
          <Select value={entity} onValueChange={(v) => { setPage(1); setEntity(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hành động</Label>
          <Select value={action} onValueChange={(v) => { setPage(1); setAction(v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Từ ngày</Label>
          <Input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Đến ngày</Label>
          <Input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} />
        </div>
      </div>

      {entityId ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-md border border-dashed border-border/60 bg-secondary/30 px-3 py-2 text-xs">
          <span>
            Đang lọc theo ID: <span className="font-mono">{entityId}</span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEntityId("");
              setPage(1);
            }}
          >
            Bỏ lọc
          </Button>
        </div>
      ) : null}

      {isError ? (
        <div className="px-4 pb-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Không tải được nhật ký."}
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[170px]">Thời gian</TableHead>
            <TableHead>Người dùng</TableHead>
            <TableHead>Hành động</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Tóm tắt</TableHead>
            <TableHead>IP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Đang tải…</TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có nhật ký phù hợp.</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">{row.actorName ?? row.actorRole ?? "Hệ thống"}</div>
                  <div className="text-xs text-muted-foreground">{row.actorEmail ?? row.actorId ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={ACTION_BADGE[row.action] ?? ""}>{row.action}</Badge>
                </TableCell>
                <TableCell className="text-xs font-mono">{row.entity}</TableCell>
                <TableCell className="text-sm">{row.summary ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.ip ?? "—"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-border/50 p-3 text-sm">
        <span className="text-muted-foreground">Tổng {total} bản ghi · Trang {page}/{totalPages}</span>
        <div className="space-x-2">
          <Button size="sm" variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>Trước</Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      </div>
    </div>
  );
}
