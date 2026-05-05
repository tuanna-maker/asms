import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, Phone, Mail, MapPin, FileText, X } from "lucide-react";

type Customer = {
  id: string; name: string; contact: string; phone: string;
  email: string; address: string; contracts: number; activeContracts: number;
};

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CustomerDetailDialog = ({ customer, open, onOpenChange }: Props) => {
  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0 [&>button]:hidden"
      >
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 space-y-0 border-b border-border bg-background px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Chi tiết khách hàng
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Đóng">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-6 pt-6">
          {/* Name & ID */}
          <div className="text-center space-y-1">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">{customer.name}</h3>
            <p className="text-sm text-muted-foreground">{customer.id}</p>
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground">Thông tin liên hệ</h4>
            <div className="space-y-2">
              <InfoRow icon={<Users className="h-4 w-4" />} value={customer.contact} />
              <InfoRow icon={<Phone className="h-4 w-4" />} value={customer.phone} />
              <InfoRow icon={<Mail className="h-4 w-4" />} value={customer.email} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} value={customer.address} />
            </div>
          </div>

          <Separator />

          {/* Contracts summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-card-foreground">Hợp đồng</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <FileText className="h-5 w-5 mx-auto text-primary mb-1" />
                <p className="text-xl font-bold text-card-foreground">{customer.contracts}</p>
                <p className="text-xs text-muted-foreground">Tổng hợp đồng</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <FileText className="h-5 w-5 mx-auto text-success mb-1" />
                <p className="text-xl font-bold text-card-foreground">{customer.activeContracts}</p>
                <p className="text-xs text-muted-foreground">Đang thực hiện</p>
              </div>
            </div>
          </div>

          {customer.activeContracts > 0 && (
            <Badge variant="default" className="w-full justify-center py-1">
              Đang có {customer.activeContracts} hợp đồng hoạt động
            </Badge>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const InfoRow = ({ icon, value }: { icon: React.ReactNode; value: string }) => (
  <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5">
    <div className="text-primary">{icon}</div>
    <span className="text-sm text-card-foreground">{value}</span>
  </div>
);

export default CustomerDetailDialog;
