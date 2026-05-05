import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductDocument } from "@/data/productsData";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (doc: ProductDocument) => void;
}

const docTypes: ProductDocument["type"][] = [
  "Hướng dẫn sử dụng",
  "Tài liệu kỹ thuật",
  "Bản vẽ",
  "Quy trình",
  "Khác",
];

const AddDocumentDialog = ({ open, onOpenChange, onAdd }: Props) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<ProductDocument["type"]>("Tài liệu kỹ thuật");
  const [version, setVersion] = useState("v1.0");
  const [size, setSize] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setType("Tài liệu kỹ thuật");
      setVersion("v1.0");
      setSize("");
      setUploadedBy("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim() || !version.trim() || !size.trim() || !uploadedBy.trim()) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    const doc: ProductDocument = {
      id: `DOC-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      type,
      version: version.trim(),
      size: size.trim(),
      uploadedBy: uploadedBy.trim(),
      uploadedAt: new Date().toISOString(),
    };
    onAdd(doc);
    toast.success("Đã thêm tài liệu");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài liệu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="doc-name">Tên tài liệu</Label>
            <Input id="doc-name" placeholder="VD: Hướng dẫn sử dụng RF-200.pdf" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Loại tài liệu</Label>
            <Select value={type} onValueChange={(v) => setType(v as ProductDocument["type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="doc-version">Phiên bản</Label>
              <Input id="doc-version" placeholder="v1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-size">Dung lượng</Label>
              <Input id="doc-size" placeholder="2.4 MB" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-uploader">Người tải lên</Label>
            <Input id="doc-uploader" placeholder="Họ tên" value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit}>Thêm tài liệu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddDocumentDialog;
