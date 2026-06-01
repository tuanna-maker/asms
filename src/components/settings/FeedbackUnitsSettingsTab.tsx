import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateFeedbackUnit,
  useCreateRoutingRule,
  useDeleteFeedbackUnit,
  useDeleteRoutingRule,
  useFeedbackExecutionUnits,
} from "@/hooks/use-feedback-execution-units-api";

export function FeedbackUnitsSettingsTab() {
  const { data: units = [], isLoading } = useFeedbackExecutionUnits();
  const createUnit = useCreateFeedbackUnit();
  const deleteUnit = useDeleteFeedbackUnit();
  const createRule = useCreateRoutingRule();
  const deleteRule = useDeleteRoutingRule();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [roleCodes, setRoleCodes] = useState("technician");
  const [ruleUnitId, setRuleUnitId] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");

  const onAddUnit = async () => {
    if (!code.trim() || !name.trim()) {
      toast.error("Nhập mã và tên đơn vị");
      return;
    }
    try {
      await createUnit.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        roleCodes: roleCodes.split(",").map((s) => s.trim()).filter(Boolean),
        notifyUserIds: [],
        isActive: true,
        sortOrder: 0,
      });
      toast.success("Đã thêm đơn vị");
      setCode("");
      setName("");
    } catch (e) {
      toastApiError(e, "Không thêm được");
    }
  };

  const onAddRule = async () => {
    if (!ruleUnitId || !ruleCategory.trim()) {
      toast.error("Chọn đơn vị và nhập dòng sản phẩm");
      return;
    }
    try {
      await createRule.mutateAsync({
        unitId: ruleUnitId,
        productCategory: ruleCategory.trim(),
        priority: 10,
      });
      toast.success("Đã thêm quy tắc định tuyến");
      setRuleCategory("");
    } catch (e) {
      toastApiError(e, "Không thêm được quy tắc");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Đơn vị xử lý phản ánh</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gán người dùng theo mã vai trò. Khi tạo phản ánh, hệ thống giao ticket theo quy tắc dòng sản phẩm.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="space-y-1">
            <Label>Mã</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BH" />
          </div>
          <div className="space-y-1">
            <Label>Tên</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bảo hành" />
          </div>
          <div className="space-y-1">
            <Label>Mã vai trò (phẩy)</Label>
            <Input value={roleCodes} onChange={(e) => setRoleCodes(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => void onAddUnit()} disabled={createUnit.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Thêm đơn vị
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Quy tắc</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-mono text-xs">{u.code}</TableCell>
              <TableCell>{u.name}</TableCell>
              <TableCell className="text-xs">{u.roleCodes.join(", ")}</TableCell>
              <TableCell className="text-xs">
                {(u.routingRules ?? []).map((r) => (
                  <div key={r.id} className="flex items-center gap-1">
                    <span>{r.productCategory ?? r.productId ?? "—"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => void deleteRule.mutateAsync(r.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void deleteUnit.mutateAsync(u.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="border-t pt-6">
        <h4 className="font-medium mb-3">Quy tắc theo dòng sản phẩm</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Đơn vị</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={ruleUnitId}
              onChange={(e) => setRuleUnitId(e.target.value)}
            >
              <option value="">Chọn…</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Dòng sản phẩm</Label>
            <Input
              value={ruleCategory}
              onChange={(e) => setRuleCategory(e.target.value)}
              placeholder="Vệ tinh, Phần cứng, …"
            />
          </div>
        </div>
        <Button className="mt-3" variant="outline" onClick={() => void onAddRule()}>
          Thêm quy tắc
        </Button>
      </div>
    </div>
  );
}
