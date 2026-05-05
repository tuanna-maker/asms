import { useState } from "react";
import { Wallet, Package, TrendingDown, BarChart3, Monitor, MapPin, Wrench, Eye, History, FileText, Calendar, AlertTriangle, Search } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import PAKDWidget from "@/components/dashboard/PAKDWidget";
import PieChartWidget from "@/components/dashboard/PieChartWidget";
import ProgressWidget from "@/components/dashboard/ProgressWidget";
import { DashboardData } from "@/data/dashboardData";
import { equipmentData, statusConfig, Equipment } from "@/data/equipmentData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface MaterialTabProps {
  data: DashboardData;
}

const EquipmentDetailDialog = ({ equipment, open, onClose }: { equipment: Equipment | null; open: boolean; onClose: () => void }) => {
  if (!equipment) return null;
  const cfg = statusConfig[equipment.status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-5 w-5 text-primary" />
            {equipment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Mã thiết bị</span>
              <p className="font-semibold text-card-foreground">{equipment.id}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Serial</span>
              <p className="font-semibold text-card-foreground text-xs sm:text-sm break-all">{equipment.serial}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Phân loại</span>
              <p className="font-semibold text-card-foreground">{equipment.category}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Trạng thái</span>
              <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Ngày nhập</span>
              <p className="font-semibold text-card-foreground">{equipment.importDate}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Hạn sử dụng</span>
              <p className="font-semibold text-card-foreground">{equipment.expiryDate || "Không giới hạn"}</p>
            </div>
          </div>

          {/* Location & Installation */}
          <div className="rounded-lg border border-border/50 p-3 sm:p-4 space-y-2">
            <h4 className="font-semibold text-card-foreground flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" /> Vị trí & Lắp đặt
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span className="text-muted-foreground text-xs">Vị trí hiện tại</span>
                <span className="font-semibold text-card-foreground">{equipment.currentLocation}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span className="text-muted-foreground text-xs">Lắp trên thiết bị</span>
                <span className="font-semibold text-card-foreground">{equipment.installedOn || "—"}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span className="text-muted-foreground text-xs">Đơn vị quản lý</span>
                <span className="font-semibold text-card-foreground">{equipment.managedBy}</span>
              </div>
            </div>
          </div>

          {/* Transfer History */}
          <div className="rounded-lg border border-border/50 p-3 sm:p-4 space-y-2">
            <h4 className="font-semibold text-card-foreground flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-accent" /> Lịch sử điều chuyển ({equipment.transferHistory.length})
            </h4>
            <div className="space-y-2">
              {equipment.transferHistory.map((t, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-3 py-1 text-sm">
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                  <p className="text-card-foreground">
                    <span className="text-muted-foreground">{t.from}</span>
                    {" → "}
                    <span className="font-semibold">{t.to}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{t.reason} • Duyệt: {t.approvedBy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance */}
          <div className="rounded-lg border border-border/50 p-3 sm:p-4 space-y-2">
            <h4 className="font-semibold text-card-foreground flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-warning" /> Bảo trì ({equipment.maintenance.length})
            </h4>
            <div className="space-y-2">
              {equipment.maintenance.map((m, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-xs">{m.date}</span>
                  <Badge variant={m.status === "done" ? "secondary" : m.status === "overdue" ? "destructive" : "outline"} className="text-xs">
                    {m.status === "done" ? "Đã xong" : m.status === "overdue" ? "Quá hạn" : "Chờ"}
                  </Badge>
                  <span className="text-card-foreground text-xs">{m.description}</span>
                </div>
              ))}
              {equipment.maintenance.length === 0 && (
                <p className="text-sm text-muted-foreground">Chưa có lịch bảo trì</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          {equipment.attachments.length > 0 && (
            <div className="rounded-lg border border-border/50 p-3 sm:p-4 space-y-2">
              <h4 className="font-semibold text-card-foreground flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-info" /> Tài liệu đính kèm
              </h4>
              <div className="flex flex-wrap gap-2">
                {equipment.attachments.map((a, i) => (
                  <Badge key={i} variant="outline" className="cursor-pointer hover:bg-secondary text-xs">
                    <FileText className="h-3 w-3 mr-1" /> {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* Mobile card for a single equipment item */
const EquipmentCard = ({ equipment, onView }: { equipment: Equipment; onView: () => void }) => {
  const cfg = statusConfig[equipment.status];
  const isExpired = equipment.expiryDate && new Date(equipment.expiryDate.split("/").reverse().join("-")) < new Date();

  return (
    <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-2" onClick={onView}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-card-foreground text-sm truncate">{equipment.name}</p>
          <p className="text-xs text-muted-foreground">{equipment.id} • {equipment.serial}</p>
        </div>
        <Badge className={`${cfg.color} border text-[10px] shrink-0`}>{cfg.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-start gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-card-foreground">{equipment.currentLocation}</span>
        </div>
        <div className="flex items-start gap-1">
          <Monitor className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-card-foreground">{equipment.installedOn || "—"}</span>
        </div>
        <div className="text-muted-foreground">QL: {equipment.managedBy}</div>
        <div>
          {equipment.expiryDate ? (
            <span className={`flex items-center gap-1 ${isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
              {isExpired && <AlertTriangle className="h-3 w-3" />}
              HSD: {equipment.expiryDate}
            </span>
          ) : <span className="text-muted-foreground">HSD: —</span>}
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">{equipment.transferHistory.length} điều chuyển • {equipment.maintenance.length} bảo trì</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye className="h-3 w-3 mr-1" /> Chi tiết
        </Button>
      </div>
    </div>
  );
};

const MaterialTab = ({ data }: MaterialTabProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const isMobile = useIsMobile();

  const totalPAKD = data.pakd.reduce((sum, p) => sum + p.total, 0);
  const remainingPAKD = data.pakd.reduce((sum, p) => sum + p.remaining, 0);
  const usedPAKD = totalPAKD - remainingPAKD;

  const filteredEquipment = equipmentData.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      e.serial.toLowerCase().includes(search.toLowerCase()) ||
      e.currentLocation.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    active: equipmentData.filter(e => e.status === "active").length,
    storage: equipmentData.filter(e => e.status === "storage").length,
    transferring: equipmentData.filter(e => e.status === "transferring").length,
    maintenance: equipmentData.filter(e => e.status === "maintenance").length,
    decommissioned: equipmentData.filter(e => e.status === "decommissioned").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Tổng thiết bị" value={equipmentData.length} icon={Monitor} color="primary" />
        <StatCard title="Đang sử dụng" value={statusCounts.active} icon={Package} color="success" />
        <StatCard title="Điều chuyển" value={statusCounts.transferring} icon={TrendingDown} color="warning" />
        <StatCard title="Sửa chữa" value={statusCounts.maintenance} icon={Wrench} color="destructive" />
      </div>

      {/* Charts first */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PieChartWidget
          title="Trạng thái thiết bị"
          icon={Monitor}
          iconColor="bg-primary/10 text-primary"
          data={[
            { name: "Đang sử dụng", value: statusCounts.active },
            { name: "Trong kho", value: statusCounts.storage },
            { name: "Điều chuyển", value: statusCounts.transferring },
            { name: "Sửa chữa", value: statusCounts.maintenance },
            { name: "Thanh lý", value: statusCounts.decommissioned },
          ]}
        />
        <PieChartWidget
          title="Sử dụng vật tư (PAKD)"
          icon={Package}
          iconColor="bg-accent/10 text-accent"
          data={[
            { name: "Đã sử dụng", value: usedPAKD },
            { name: "Còn lại", value: remainingPAKD },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <PAKDWidget data={data.pakd} />
        <ProgressWidget
          title="Tiến độ sử dụng PAKD"
          icon={Wallet}
          total={totalPAKD}
          items={[
            { label: "Đã sử dụng", value: usedPAKD, color: "bg-success" },
            { label: "Còn lại", value: remainingPAKD, color: "bg-warning" },
          ]}
        />
      </div>

      {/* Equipment table at the bottom */}
      <div className="rounded-xl bg-card p-3 sm:p-5 shadow-sm border border-border/50 space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Monitor className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground text-sm sm:text-base">Theo dõi thiết bị</h3>
          <Badge variant="secondary" className="ml-auto text-xs">{equipmentData.length} thiết bị</Badge>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm theo mã, tên, serial, vị trí..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang sử dụng</SelectItem>
              <SelectItem value="storage">Trong kho</SelectItem>
              <SelectItem value="transferring">Đang điều chuyển</SelectItem>
              <SelectItem value="maintenance">Đang sửa chữa</SelectItem>
              <SelectItem value="decommissioned">Thanh lý</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isMobile ? (
          <div className="space-y-2">
            {filteredEquipment.map((e) => (
              <EquipmentCard key={e.id} equipment={e} onView={() => setSelectedEquipment(e)} />
            ))}
            {filteredEquipment.length === 0 && (
              <p className="text-center py-8 text-sm text-muted-foreground">Không tìm thấy thiết bị</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Vị trí hiện tại</TableHead>
                  <TableHead>Lắp trên</TableHead>
                  <TableHead>Đơn vị QL</TableHead>
                  <TableHead>Hạn SD</TableHead>
                  <TableHead className="text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.map((e) => {
                  const cfg = statusConfig[e.status];
                  const isExpired = e.expiryDate && new Date(e.expiryDate.split("/").reverse().join("-")) < new Date();
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium text-primary">{e.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.serial}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-card-foreground">{e.currentLocation}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-card-foreground">{e.installedOn || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm text-card-foreground">{e.managedBy}</TableCell>
                      <TableCell>
                        {e.expiryDate ? (
                          <span className={`text-sm flex items-center gap-1 ${isExpired ? "text-destructive font-semibold" : "text-card-foreground"}`}>
                            {isExpired && <AlertTriangle className="h-3 w-3" />}
                            {e.expiryDate}
                          </span>
                        ) : <span className="text-sm text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedEquipment(e)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredEquipment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không tìm thấy thiết bị</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <EquipmentDetailDialog equipment={selectedEquipment} open={!!selectedEquipment} onClose={() => setSelectedEquipment(null)} />
    </div>
  );
};

export default MaterialTab;
