import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRolesList, type RoleItem } from "@/hooks/use-roles-api";

type Props = {
  value: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  addButtonLabel?: string;
  emptyLabel?: string;
  activeOnly?: boolean;
};

export function RoleMultiSelect({
  value,
  onChange,
  disabled,
  label = "Vai trò",
  hint,
  addButtonLabel = "Thêm vai trò…",
  emptyLabel = "Chưa chọn vai trò",
  activeOnly = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: roles = [], isLoading } = useRolesList(open || value.length > 0);

  const availableRoles = useMemo(
    () => (activeOnly ? roles.filter((r) => r.isActive) : roles),
    [roles, activeOnly],
  );

  const selectedRoles = useMemo(() => {
    return value.map((code) => {
      const role = availableRoles.find((r) => r.code === code);
      return role ?? ({ code, name: code } as Pick<RoleItem, "code" | "name">);
    });
  }, [availableRoles, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return availableRoles
      .filter((r) => !value.includes(r.code))
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [availableRoles, search, value]);

  const add = (code: string) => {
    if (!value.includes(code)) onChange([...value, code]);
    setSearch("");
  };

  const remove = (code: string) => onChange(value.filter((v) => v !== code));

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-1.5 min-h-[2rem] rounded-md border border-border/60 bg-background/80 px-2.5 py-2">
        {selectedRoles.map((r) => (
          <Badge key={r.code} variant="secondary" className="gap-1 pr-1">
            {r.name}
            {!disabled ? (
              <button
                type="button"
                className="rounded-full hover:bg-muted p-0.5"
                onClick={() => remove(r.code)}
                aria-label={`Bỏ vai trò ${r.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </Badge>
        ))}
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground self-center">{emptyLabel}</span>
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
              placeholder="Tìm theo tên hoặc mã vai trò…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                  {isLoading ? "Đang tải…" : "Không tìm thấy vai trò"}
                </p>
              ) : (
                filtered.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="w-full text-left rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => {
                      add(r.code);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-xs text-muted-foreground">{r.code}</span>
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
