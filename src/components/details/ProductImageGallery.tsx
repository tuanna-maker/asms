import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-documents-api";
import { useAuth } from "@/hooks/use-auth";
import { resolveUploadUrl } from "@/lib/upload-url";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 3 * 1024 * 1024;
const IMAGE_CATEGORY = "product_image";

type ProductImageDoc = {
  id: string;
  name: string;
  fileUrl?: string | null;
  fileType?: string | null;
};

interface Props {
  productId: string;
}

const ProductImageGallery = ({ productId }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["product-images", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ProductImageDoc[]>>(
        `/api/v1/documents?productId=${encodeURIComponent(productId)}`,
      );
      const rows = res.data.data ?? [];
      return rows.filter(
        (d) => d.fileType === "img" || Boolean(d.fileUrl?.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)),
      );
    },
  });

  const remaining = MAX_IMAGES - images.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    let added = 0;
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: không phải ảnh`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: vượt quá 3MB`);
        continue;
      }
      try {
        await uploadDocument.mutateAsync({
          file,
          productId,
          ownerId: user?.id,
          name: file.name.replace(/\.[^.]+$/, "") || file.name,
          categoryCode: IMAGE_CATEGORY,
          fileType: "img",
        });
        added += 1;
      } catch {
        toast.error(`Không tải được ${file.name}`);
      }
    }
    if (added > 0) {
      await queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      await queryClient.invalidateQueries({ queryKey: ["product-documents", productId] });
      toast.success(`Đã thêm ${added} ảnh`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = async (docId: string) => {
    try {
      await deleteDocument.mutateAsync(docId);
      await queryClient.invalidateQueries({ queryKey: ["product-images", productId] });
      await queryClient.invalidateQueries({ queryKey: ["product-documents", productId] });
      toast.success("Đã xóa ảnh");
    } catch {
      toast.error("Không xóa được ảnh");
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Hình ảnh sản phẩm</p>
            <span className="text-xs text-muted-foreground">
              ({images.length}/{MAX_IMAGES})
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES || uploadDocument.isPending}
          >
            {uploadDocument.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-1" />
            )}
            Thêm ảnh
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải ảnh…
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Chưa có ảnh. Tối đa {MAX_IMAGES} ảnh, mỗi ảnh ≤ 3MB.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((doc) => (
              <div
                key={doc.id}
                className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
              >
                {doc.fileUrl ? (
                  <img
                    src={resolveUploadUrl(doc.fileUrl)}
                    alt={doc.name}
                    className="h-full w-full object-cover cursor-pointer"
                    onClick={() => setPreview(resolveUploadUrl(doc.fileUrl!))}
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground px-1 text-center">
                    {doc.name}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void remove(doc.id)}
                  className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Xóa ảnh"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="max-w-3xl p-2">
            {preview && <img src={preview} alt="Xem ảnh" className="w-full h-auto rounded" />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductImageGallery;
