import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FilterOption {
  value: string;
  label: string;
}

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  filterable?: boolean;
  filterOptions?: FilterOption[];
}

interface DashboardTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
}

type SortDir = "asc" | "desc" | null;

function DashboardTable<T>({
  title, columns, data, emptyMessage = "Không có dữ liệu",
  searchable = true, searchPlaceholder = "Tìm kiếm...", searchKeys,
}: DashboardTableProps<T>) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const visibleColumns = isMobile ? columns.filter(c => !c.hideOnMobile) : columns;
  const filterableColumns = columns.filter(c => c.filterable && c.filterOptions);
  const hasFilters = filterableColumns.length > 0;
  const activeFilterCount = Object.values(filters).filter(v => v && v !== "all").length;

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
      else setSortDir("asc");
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const keys = searchKeys || columns.map(c => c.key);
      result = result.filter(row => {
        const rec = row as Record<string, unknown>;
        return keys.some(k => String(rec[k] ?? "").toLowerCase().includes(q));
      });
    }

    // Filters
    for (const [key, value] of Object.entries(filters)) {
      if (!value || value === "all") continue;
      result = result.filter(row => {
        const rec = row as Record<string, unknown>;
        return String(rec[key] ?? "") === value;
      });
    }

    // Sort
    if (sortKey && sortDir) {
      const col = columns.find(c => c.key === sortKey);
      result.sort((a, b) => {
        const av = col?.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey];
        const bv = col?.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey];
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av ?? "").localeCompare(String(bv ?? ""), "vi");
        return sortDir === "desc" ? -cmp : cmp;
      });
    }

    return result;
  }, [data, search, filters, sortKey, sortDir, columns, searchKeys]);

  const clearAll = () => {
    setSearch("");
    setFilters({});
    setSortKey(null);
    setSortDir(null);
  };

  const isFiltered = search.trim() || activeFilterCount > 0;

  return (
    <div className="rounded-xl bg-card p-3 sm:p-5 shadow-sm border border-border/50 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="font-semibold text-card-foreground text-sm sm:text-base">{title}</h3>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isFiltered && (
            <span>{processedData.length}/{data.length} kết quả</span>
          )}
          {sortKey && sortDir && (
            <Badge variant="secondary" className="text-[10px] gap-0.5">
              {sortDir === "asc" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {columns.find(c => c.key === sortKey)?.label}
            </Badge>
          )}
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        {searchable && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {hasFilters && (
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs shrink-0 w-full sm:w-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Lọc
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-0.5 h-4 w-4 rounded-full p-0 text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
        {isFiltered && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground shrink-0 w-full sm:w-auto" onClick={clearAll}>
            <X className="h-3 w-3 mr-1" /> Xóa lọc
          </Button>
        )}
      </div>

      {/* Filter selects */}
      {showFilters && hasFilters && (
        <div className="flex flex-wrap gap-2 pb-1">
          {filterableColumns.map(col => (
            <Select key={col.key} value={filters[col.key] || "all"} onValueChange={(v) => setFilters(prev => ({ ...prev, [col.key]: v }))}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] h-8 text-xs">
                <SelectValue placeholder={col.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả {col.label.toLowerCase()}</SelectItem>
                {col.filterOptions!.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map(col => (
                <TableHead
                  key={col.key}
                  className={`${col.className || ""} ${col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""}`}
                  onClick={() => handleSort(col)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortKey === col.key ? (
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )
                    )}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground text-sm">
                  {isFiltered ? "Không tìm thấy kết quả phù hợp" : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, i) => (
                <TableRow key={i}>
                  {visibleColumns.map(col => (
                    <TableCell key={col.key} className={`text-xs sm:text-sm ${col.className || ""}`}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default DashboardTable;

// Utility badge for status rendering
export const StatusBadge = ({ status, label }: { status: "success" | "warning" | "destructive" | "info" | "default"; label: string }) => {
  const styles = {
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    info: "bg-info/10 text-info border-info/30",
    default: "bg-muted text-muted-foreground",
  };
  return <Badge className={`${styles[status]} border text-xs`}>{label}</Badge>;
};
