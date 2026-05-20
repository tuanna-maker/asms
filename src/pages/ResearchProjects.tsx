import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, LayoutGrid, List, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { getStatusLabel, getStatusColor } from "@/data/researchData";
import type { ResearchProject } from "@/data/researchData";
import CreateResearchDialog from "@/components/research/CreateResearchDialog";
import { mapResearchProjectListRow } from "@/lib/research-project-mapper";
import {
  useCreateResearchProject,
  useDeleteResearchProject,
  useResearchProjectsList,
  useUpdateResearchProject,
} from "@/hooks/use-research-projects-api";
import { toast } from "sonner";
import { useListPagination } from "@/hooks/use-list-pagination";
import ListPaginationBar from "@/components/ui/ListPaginationBar";

function dateToIsoStartOfDay(s: string) {
  if (!s) return new Date().toISOString();
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const ResearchProjects = () => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"card" | "table">("card");
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<ResearchProject | null>(null);

  const { data: rows = [], isLoading, isError } = useResearchProjectsList();
  const projects = useMemo(() => rows.map(mapResearchProjectListRow), [rows]);
  const createMutation = useCreateResearchProject();
  const updateMutation = useUpdateResearchProject();
  const deleteMutation = useDeleteResearchProject();
  const [deletingProject, setDeletingProject] = useState<ResearchProject | null>(null);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.manager.toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search]
  );

  const {
    pagedItems: pagedProjects,
    page: projectPage,
    setPage: setProjectPage,
    totalPages: projectTotalPages,
    total: projectTotal,
    pageSize: projectPageSize,
    startIndex: projectStartIndex,
  } = useListPagination(filtered, { resetDeps: [search] });

  const handleSave = async (data: Partial<ResearchProject>) => {
    if (!data.name?.trim() || !data.code?.trim()) {
      toast.error("Vui lòng nhập mã và tên đề tài");
      return;
    }
    try {
      if (editProject) {
        await updateMutation.mutateAsync({
          id: editProject.code,
          payload: {
            code: data.code,
            name: data.name,
            department: data.department,
            fundingSource: data.fundingSource,
            startDate: dateToIsoStartOfDay(data.startDate || editProject.startDate),
            endDate: dateToIsoStartOfDay(data.endDate || editProject.endDate),
            description: data.description,
            status: data.status,
            progress: data.progress,
          },
        });
        toast.success("Đã cập nhật đề tài");
      } else {
        await createMutation.mutateAsync({
          code: data.code.trim(),
          name: data.name.trim(),
          department: data.department?.trim() || undefined,
          fundingSource: data.fundingSource?.trim() || undefined,
          startDate: dateToIsoStartOfDay(data.startDate || ""),
          endDate: dateToIsoStartOfDay(data.endDate || ""),
          description: data.description?.trim() || undefined,
        });
        toast.success("Đã tạo đề tài");
      }
      setShowCreate(false);
      setEditProject(null);
    } catch {
      toast.error(editProject ? "Không thể cập nhật đề tài" : "Không thể tạo đề tài");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Đề tài nghiên cứu</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? "Đang tải…" : `${filtered.length} đề tài`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setView("card")}
              className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${view === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {!isMobile && <span>Card</span>}
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${view === "table" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
            >
              <List className="w-3.5 h-3.5" />
              {!isMobile && <span>Danh sách</span>}
            </button>
          </div>
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5" disabled={createMutation.isPending}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Đề tài mới</span>
          </Button>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Không tải được danh sách đề tài.</p>
      )}

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm..."
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Card View */}
      {view === "card" && !isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {pagedProjects.map((p) => (
            <div key={p.code} className="rounded-xl bg-card border border-border/50 p-4 shadow-sm group relative hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">{p.code}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditProject(p);
                      setShowCreate(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setDeletingProject(p);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Badge className={`${getStatusColor(p.status)} border-0 text-xs`}>{getStatusLabel(p.status)}</Badge>
                </div>
              </div>
              <Link to={`/de-tai/${encodeURIComponent(p.code)}`}>
                <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2 text-sm">{p.name}</h3>
              </Link>
              <p className="text-xs text-muted-foreground mb-3">Chủ nhiệm: {p.manager || "—"}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Tiến độ</span>
                <span className="font-mono font-medium">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-1.5" />
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground font-mono">
                <span>{p.startDate}</span>
                <span>{p.endDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && !isLoading && (
        <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Mã</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Tên đề tài</th>
                  {!isMobile && <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Chủ nhiệm</th>}
                  {!isMobile && <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Thời gian</th>}
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground w-36">Tiến độ</th>
                  <th className="py-3 px-4 w-12" />
                </tr>
              </thead>
              <tbody>
                {pagedProjects.map((p) => (
                  <tr key={p.code} className="border-b last:border-0 hover:bg-muted/20 transition-colors group">
                    <td className="py-3 px-4">
                      <Link to={`/de-tai/${encodeURIComponent(p.code)}`} className="font-mono text-xs text-primary hover:underline">{p.code}</Link>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <Link to={`/de-tai/${encodeURIComponent(p.code)}`} className="font-medium hover:text-primary transition-colors line-clamp-1">{p.name}</Link>
                    </td>
                    {!isMobile && <td className="py-3 px-4 text-muted-foreground">{p.manager || "—"}</td>}
                    {!isMobile && <td className="py-3 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">{p.startDate} → {p.endDate}</td>}
                    <td className="py-3 px-4">
                      <Badge className={`${getStatusColor(p.status)} border-0 text-[10px]`}>{getStatusLabel(p.status)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Progress value={p.progress} className="h-1.5 flex-1" />
                        <span className="text-xs font-mono text-muted-foreground w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditProject(p);
                            setShowCreate(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingProject(p)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Không tìm thấy đề tài nào phù hợp
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <ListPaginationBar
          page={projectPage}
          totalPages={projectTotalPages}
          totalItems={projectTotal}
          pageSize={projectPageSize}
          onPageChange={setProjectPage}
        />
      )}

      <CreateResearchDialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setEditProject(null);
        }}
        onSave={(data) => handleSave(data)}
        editProject={editProject}
      />

      <AlertDialog open={deletingProject !== null} onOpenChange={(o) => !o && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đề tài?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProject ? `${deletingProject.code} — ${deletingProject.name}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingProject) return;
                const pid = deletingProject.backendId ?? deletingProject.code;
                void deleteMutation
                  .mutateAsync(pid)
                  .then(() => {
                    toast.success("Đã xóa đề tài");
                    setDeletingProject(null);
                  })
                  .catch(() => toast.error("Không xóa được"));
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResearchProjects;
