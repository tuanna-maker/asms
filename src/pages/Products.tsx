import { useState, useMemo, useEffect } from "react";
import { Search, Package, Plus, Eye, Layers, CheckCircle, Clock, Cpu, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productCategoryColors, DefenseProduct } from "@/data/productsData";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import { resolveDefinitionLabel } from "@/lib/attribute-definition-map";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import ProductDetailDialog from "@/components/details/ProductDetailDialog";
import CreateProductDialog from "@/components/details/CreateProductDialog";
import StatCard from "@/components/dashboard/StatCard";
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
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateProduct,
  useDeleteProduct,
  useDeleteProductBom,
  useProductsList,
  useUpdateProduct,
  useUpdateProductBom,
  useUpsertProductBom,
  type ProductListItem,
} from "@/hooks/use-products-api";
import { toast } from "sonner";

function apiProductToDefense(p: ProductListItem): DefenseProduct {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    description: p.description ?? "",
    status: p.status,
    version: p.version ?? "v1.0",
    unit: p.unit ?? "—",
    manufacturer: p.manufacturer ?? "—",
    yearReleased: p.yearReleased ?? new Date().getFullYear(),
    totalProduced: p.totalProduced,
    bom: (p.bom ?? []).map((item) => ({
      materialId: item.materialId,
      materialName: item.materialName,
      quantity: item.quantity,
      unit: item.unit,
      ...(item.serialNumbers && item.serialNumbers.length > 0 ? { serialNumbers: item.serialNumbers } : {}),
    })),
    specs: (p.specs ?? []).map((s) => ({
      key: s.key,
      label: s.label,
      ...(s.unit ? { unit: s.unit } : {}),
    })),
  };
}

const statusLabel: Record<DefenseProduct["status"], { label: string; cls: string }> = {
  developing: { label: "Đang phát triển", cls: "bg-warning/10 text-warning border-warning/30" },
  producing: { label: "Đang sản xuất", cls: "bg-info/10 text-info border-info/30" },
  equipped: { label: "Đã trang bị", cls: "bg-success/10 text-success border-success/30" },
  stopped: { label: "Dừng SX", cls: "bg-muted text-muted-foreground border-border" },
};

const Products = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: apiProducts = [], isLoading: productsLoading } = useProductsList(!authLoading && isAuthenticated);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const upsertProductBom = useUpsertProductBom();
  const updateProductBom = useUpdateProductBom();
  const deleteProductBom = useDeleteProductBom();

  const { data: categoryDefs = [] } = useDefinitionsList("product_category");
  const statusOptions = useDefinitionOptions("product_status");
  const [products, setProducts] = useState<DefenseProduct[]>([]);

  useEffect(() => {
    setProducts(apiProducts.map(apiProductToDefense));
  }, [apiProducts]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [selected, setSelected] = useState<DefenseProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<DefenseProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<DefenseProduct | null>(null);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const categoryFilterOptions = useMemo(() => {
    const fromDefs = categoryDefs.map((d) => ({ value: d.code, label: d.label }));
    const known = new Set(fromDefs.map((d) => d.value));
    const extras = categories
      .filter((c) => !known.has(c))
      .map((c) => ({ value: c, label: resolveDefinitionLabel(categoryDefs, c) }));
    return [...fromDefs, ...extras];
  }, [categoryDefs, categories]);

  const categoryLabel = (code: string) => resolveDefinitionLabel(categoryDefs, code);
  const categoryColor = (code: string) => {
    const label = categoryLabel(code);
    return productCategoryColors[label] ?? productCategoryColors[code] ?? "bg-muted text-muted-foreground border-border";
  };

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    const matchCat = category === "all" || p.category === category;
    const matchStatus = status === "all" || p.status === status;
    return matchSearch && matchCat && matchStatus;
  }), [products, search, category, status]);

  const stats = useMemo(() => ({
    total: products.length,
    developing: products.filter(p => p.status === "developing").length,
    producing: products.filter(p => p.status === "producing").length,
    equipped: products.filter(p => p.status === "equipped").length,
  }), [products]);

  const openDetail = (p: DefenseProduct) => { setSelected(p); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sản phẩm Quốc phòng</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các sản phẩm quốc phòng và danh mục linh kiện cấu thành (BOM)</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Thêm sản phẩm</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng sản phẩm" value={stats.total} icon={Package} color="primary" />
        <StatCard title="Đang phát triển" value={stats.developing} icon={Cpu} color="warning" />
        <StatCard title="Đang sản xuất" value={stats.producing} icon={Clock} color="info" />
        <StatCard title="Đã trang bị" value={stats.equipped} icon={CheckCircle} color="success" />
      </div>

      {!isAuthenticated && !authLoading && (
        <p className="text-sm text-muted-foreground">Đăng nhập để xem và quản lý sản phẩm từ máy chủ.</p>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên, mã SP, mã quân sự..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Phân loại" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phân loại</SelectItem>
                {categoryFilterOptions.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {statusOptions.map((row) => (
                  <SelectItem key={row.value} value={row.value}>{row.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã quân sự</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>ID hệ thống</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead className="text-center">Linh kiện</TableHead>
                  <TableHead className="text-right">Đã SX</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading && isAuthenticated ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                    <TableCell className="font-mono font-semibold text-primary">{p.code}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 12)}…</TableCell>
                    <TableCell><Badge variant="outline" className={categoryColor(p.category)}>{categoryLabel(p.category)}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" />{p.bom.length}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{p.totalProduced.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={(statusLabel[p.status] ?? statusLabel.developing).cls}>
                        {(statusLabel[p.status] ?? statusLabel.developing).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" onClick={() => openDetail(p)}><Eye className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { setProductToEdit(p); setEditOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setProductToDelete(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!productsLoading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {isAuthenticated ? "Không có sản phẩm phù hợp" : "Chưa có dữ liệu"}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(p => (
              <Card key={p.id} className="cursor-pointer" onClick={() => openDetail(p)}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-primary">{p.code}</p>
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate" title={p.id}>{p.id}</p>
                    </div>
                    <Badge variant="outline" className={(statusLabel[p.status] ?? statusLabel.developing).cls}>
                      {(statusLabel[p.status] ?? statusLabel.developing).label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className={categoryColor(p.category)}>{categoryLabel(p.category)}</Badge>
                    <Badge variant="outline" className="gap-1"><Layers className="h-3 w-3" />{p.bom.length} linh kiện</Badge>
                    <Badge variant="outline">SX: {p.totalProduced}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-6 text-sm">Không có sản phẩm phù hợp</p>}
          </div>
        </CardContent>
      </Card>

      <ProductDetailDialog
        product={selected ? products.find(p => p.id === selected.id) ?? selected : null}
        open={open}
        onOpenChange={setOpen}
        onUpdateBomQuantity={async (productId, materialId, quantity) => {
          await updateProductBom.mutateAsync({
            id: productId,
            materialId,
            payload: { quantity },
          });
        }}
        onRemoveBom={async (productId, materialId) => {
          await deleteProductBom.mutateAsync({ id: productId, materialId });
        }}
        onAddBom={async (productId, bomItem) => {
          await upsertProductBom.mutateAsync({
            id: productId,
            payload: {
              materialId: bomItem.materialId,
              quantity: bomItem.quantity,
              ...(bomItem.serialNumbers?.length ? { serialNumbers: bomItem.serialNumbers } : {}),
            },
          });
        }}
      />
      <CreateProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        apiMode={isAuthenticated}
        existingCodes={products.map((p) => p.code)}
        onApiCreate={async (payload) => {
          await createProduct.mutateAsync(payload);
        }}
      />

      <ProductDetailDialog
        product={productToEdit ? products.find((p) => p.id === productToEdit.id) ?? productToEdit : null}
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setProductToEdit(null);
        }}
        onUpdateBomQuantity={async (productId, materialId, quantity) => {
          await updateProductBom.mutateAsync({
            id: productId,
            materialId,
            payload: { quantity },
          });
        }}
        onRemoveBom={async (productId, materialId) => {
          await deleteProductBom.mutateAsync({ id: productId, materialId });
        }}
        onAddBom={async (productId, bomItem) => {
          await upsertProductBom.mutateAsync({
            id: productId,
            payload: {
              materialId: bomItem.materialId,
              quantity: bomItem.quantity,
              ...(bomItem.serialNumbers?.length ? { serialNumbers: bomItem.serialNumbers } : {}),
            },
          });
        }}
        editable
        onSaveEdits={async (id, payload) => {
          await updateProduct.mutateAsync({ id, payload });
        }}
      />

      <AlertDialog open={productToDelete !== null} onOpenChange={(o) => !o && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete ? `${productToDelete.code} — ${productToDelete.name}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!productToDelete) return;
                void deleteProduct
                  .mutateAsync(productToDelete.id)
                  .then(() => {
                    toast.success("Đã xóa sản phẩm");
                    setProductToDelete(null);
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

export default Products;
