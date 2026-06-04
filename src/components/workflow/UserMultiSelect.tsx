import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsersList } from "@/hooks/use-users-api";

type Props = {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  addButtonLabel?: string;
};

export function UserMultiSelect({
  value,
  onChange,
  disabled,
  label = "Người xử lý cụ thể",
  hint = "Để trống = mọi người có vai trò xử lý đều được duyệt bước này.",
  addButtonLabel = "Thêm người xử lý…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: users = [], isLoading } = useUsersList(open || value.length > 0);

  const selectedUsers = useMemo(
    () => users.filter((u) => value.includes(u.id)),
    [users, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => u.status === "active")
      .filter((u) => !value.includes(u.id))
      .filter((u) => {
        if (!q) return true;
        return (
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [users, search, value]);

  const add = (id: string) => {
    if (!value.includes(id)) onChange([...value, id]);
    setSearch("");
  };

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-1.5 min-h-[2rem] rounded-md border border-border/60 bg-background/80 px-2.5 py-2">
        {selectedUsers.map((u) => (
          <Badge key={u.id} variant="secondary" className="gap-1 pr-1">
            {u.fullName}
            {!disabled ? (
              <button
                type="button"
                className="rounded-full hover:bg-muted p-0.5"
                onClick={() => remove(u.id)}
                aria-label={`Bỏ ${u.fullName}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </Badge>
        ))}
        {value.length === 0 && !disabled ? (
          <span className="text-xs text-muted-foreground self-center">Chưa chọn người</span>
        ) : null}
      </div>
      {!disabled ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-full justify-start">
              {isLoading ? "Đang tải…" : addButtonLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
            <Input
              placeholder="Tìm theo tên hoặc email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                  {isLoading ? "Đang tải…" : "Không tìm thấy người dùng"}
                </p>
              ) : (
                filtered.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => {
                      add(u.id);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{u.fullName}</span>
                    <span className="block text-xs text-muted-foreground">{u.email}</span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
