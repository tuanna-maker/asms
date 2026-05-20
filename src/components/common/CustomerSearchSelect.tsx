import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCustomerDetail, useCustomersList } from "@/hooks/use-customers-api";

type CustomerRow = { id: string; code?: string; name: string };

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Nhãn hiển thị khi chưa load được từ API */
  displayName?: string;
};

export function CustomerSearchSelect({
  value,
  onChange,
  disabled,
  placeholder = "Chọn khách hàng…",
  displayName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data: customers = [], isLoading } = useCustomersList(
    debouncedSearch ? { search: debouncedSearch } : undefined,
  );
  const { data: selectedDetail } = useCustomerDetail(value);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const fromList = (customers as CustomerRow[]).find((c) => c.id === value);
    if (fromList?.name) return fromList.name;
    if (selectedDetail && typeof selectedDetail.name === "string") return selectedDetail.name;
    if (displayName) return displayName;
    return value;
  }, [value, customers, selectedDetail, displayName]);

  const options = useMemo(() => {
    const rows = customers as CustomerRow[];
    if (value && !rows.some((c) => c.id === value) && selectedDetail) {
      return [
        {
          id: value,
          code: typeof selectedDetail.code === "string" ? selectedDetail.code : undefined,
          name: typeof selectedDetail.name === "string" ? selectedDetail.name : selectedLabel,
        },
        ...rows,
      ];
    }
    return rows;
  }, [customers, value, selectedDetail, selectedLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tìm theo tên hoặc mã…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{isLoading ? "Đang tải…" : "Không tìm thấy khách hàng"}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                — Không chọn —
              </CommandItem>
              {options.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`${c.name} ${c.code ?? ""}`}
                  onSelect={() => {
                    onChange(c.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="font-medium">{c.name}</span>
                  {c.code ? (
                    <span className="ml-2 text-xs text-muted-foreground">{c.code}</span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
