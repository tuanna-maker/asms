import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB per image
const STORAGE_PREFIX = "product-images:";

interface Props {
  productId: string;
}

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const ProductImageGallery = ({ productId }: Props) => {
  const key = STORAGE_PREFIX + productId;
  const [images, setImages] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setImages(raw ? JSON.parse(raw) : []);
    } catch {
      setImages([]);
    }
  }, [key]);

  const persist = (next: string[]) => {
    setImages(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      toast.error("Không thể lưu ảnh (vượt dung lượng trình duyệt)");
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    const valid: string[] = [];
    for (const f of list) {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name}: không phải ảnh`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: vượt quá 3MB`);
        continue;
      }
      try {
        valid.push(await readFileAsDataURL(f));
      } catch {
        toast.error(`Lỗi đọc ${f.name}`);
      }
    }
    if (valid.length) {
      persist([...images, ...valid]);
      toast.success(`Đã thêm ${valid.length} ảnh`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (idx: number) => {
    persist(images.filter((_, i) => i !== idx));
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Hình ảnh sản phẩm</p>
            <span className="text-xs text-muted-foreground">({images.length}/{MAX_IMAGES})</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES}
          >
            <ImagePlus className="h-4 w-4 mr-1" />
            Thêm ảnh
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Chưa có ảnh. Tối đa {MAX_IMAGES} ảnh, mỗi ảnh ≤ 3MB.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {images.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={src}
                  alt={`Ảnh sản phẩm ${i + 1}`}
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => setPreview(src)}
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
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
            {preview && (
              <img src={preview} alt="Xem ảnh" className="w-full h-auto rounded" />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProductImageGallery;
