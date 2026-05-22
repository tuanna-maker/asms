import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CustomerFeedbackRow } from "@/hooks/use-customer-feedbacks-api";
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  formatFeedbackDate,
  severityVariant,
  statusVariant,
} from "@/lib/customer-feedback-labels";

export type CustomerFeedbackDetailSheetProps = {
  row: CustomerFeedbackRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readonly?: boolean;
  onEdit?: (row: CustomerFeedbackRow) => void;
  onDelete?: (row: CustomerFeedbackRow) => void;
};

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function CustomerFeedbackDetailSheet({
  row,
  open,
  onOpenChange,
  readonly = false,
  onEdit,
  onDelete,
}: CustomerFeedbackDetailSheetProps) {
  const navigate = useNavigate();

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{row.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant={severityVariant[row.severity]}>{SEVERITY_LABELS[row.severity]}</Badge>
            <Badge variant={statusVariant[row.status]}>{STATUS_LABELS[row.status]}</Badge>
          </div>

          <DetailField label="Nội dung">
            <p className="whitespace-pre-wrap text-card-foreground">{row.content}</p>
          </DetailField>

          <DetailField label="Ngày phản ánh">{formatFeedbackDate(row.feedbackAt)}</DetailField>

          <DetailField label="Khách hàng">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <span className="font-mono text-xs text-muted-foreground">{row.customer.code}</span>
                {" — "}
                {row.customer.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => goTo("/khach-hang")}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Mở CRM
              </Button>
            </div>
          </DetailField>

          {row.contract && (
            <DetailField label="Hợp đồng">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  <span className="font-mono text-xs">{row.contract.code}</span>
                  {" — "}
                  {row.contract.title}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => goTo("/hop-dong")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Mở HĐ
                </Button>
              </div>
            </DetailField>
          )}

          {row.warranty && (
            <DetailField label="Bảo hành">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  <span className="font-mono text-xs">{row.warranty.code}</span>
                  {" — "}
                  {row.warranty.issue}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => goTo("/bao-hanh")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Mở BH
                </Button>
              </div>
            </DetailField>
          )}

          <DetailField label="Người tạo">
            {row.createdBy?.fullName ?? "—"}
          </DetailField>

          <DetailField label="Mã nội bộ">
            <span className="font-mono text-xs text-muted-foreground break-all">{row.id}</span>
          </DetailField>

          <DetailField label="Tạo lúc">{formatFeedbackDate(row.createdAt)}</DetailField>
          <DetailField label="Cập nhật">{formatFeedbackDate(row.updatedAt)}</DetailField>

          {!readonly && (onEdit || onDelete) && (
            <div className="flex gap-2 pt-2 border-t border-border/60">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(row)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Xóa
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
