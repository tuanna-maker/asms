import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Keyboard, ScanLine, QrCode, Barcode, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BarcodeScannerDialogProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string, format: string) => void;
}

const BarcodeScannerDialog = ({ open, onClose, onScan }: BarcodeScannerDialogProps) => {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return;
    setCameraError(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      
      const scannerId = "qr-scanner-region";
      // Ensure container exists
      let el = document.getElementById(scannerId);
      if (!el && containerRef.current) {
        el = document.createElement("div");
        el.id = scannerId;
        containerRef.current.appendChild(el);
      }

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string, result: any) => {
          const format = result?.result?.format?.formatName || "QR/Barcode";
          onScan(decodedText, format);
          toast.success(`Đã quét: ${decodedText}`, { description: `Định dạng: ${format}` });
          stopScanner();
          onClose();
        },
        () => {} // ignore errors during scanning
      );
    } catch (err: any) {
      setScanning(false);
      setCameraError(err?.message || "Không thể truy cập camera. Vui lòng cấp quyền camera.");
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setMode("manual");
      setManualCode("");
      setCameraError(null);
    }
  }, [open, stopScanner]);

  useEffect(() => {
    if (mode === "camera" && open) {
      // Small delay to let DOM render
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [mode, open, startScanner, stopScanner]);

  const handleManualSubmit = () => {
    const code = manualCode.trim();
    if (!code) {
      toast.error("Vui lòng nhập mã");
      return;
    }
    onScan(code, "Manual");
    toast.success(`Đã nhập mã: ${code}`);
    setManualCode("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Quét mã QR / Barcode
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setMode("manual")}
          >
            <Keyboard className="h-4 w-4" />
            Nhập mã
          </Button>
          <Button
            variant={mode === "camera" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => setMode("camera")}
          >
            <Camera className="h-4 w-4" />
            Quét camera
          </Button>
        </div>

        {mode === "manual" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nhập Serial / Barcode / QR Code / RFID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="VD: SN-RF100-042, 6901234567890..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  autoFocus
                />
                <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                  Tìm
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Barcode, label: "Barcode", hint: "Mã vạch sản phẩm" },
                { icon: QrCode, label: "QR Code", hint: "Mã QR vật tư" },
              ].map(({ icon: Icon, label, hint }) => (
                <div key={label} className="flex items-center gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Hỗ trợ tìm kiếm theo Serial, Barcode, QR Code và RFID
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center"
            >
              {scanning && !cameraError && (
                <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                  <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                    <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-primary/60 animate-pulse" />
                  </div>
                </div>
              )}
              {!scanning && !cameraError && (
                <div className="text-center text-muted-foreground space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="text-sm">Đang khởi động camera...</p>
                </div>
              )}
              {cameraError && (
                <div className="text-center text-destructive space-y-2 p-4">
                  <Camera className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={startScanner}>
                    Thử lại
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ScanLine className="h-3.5 w-3.5" />
              Hướng camera vào mã QR hoặc Barcode để quét tự động
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
