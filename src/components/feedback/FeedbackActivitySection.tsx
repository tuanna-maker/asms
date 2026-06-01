import { useMemo, useState } from "react";
import { Loader2, MessageSquare, Wrench } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useCreateFeedbackComment,
  type CustomerFeedbackRow,
  type FeedbackCommentKind,
} from "@/hooks/use-customer-feedbacks-api";
import {
  COMMENT_KIND_LABELS,
  TIMELINE_EVENT_LABELS,
  formatFeedbackDate,
} from "@/lib/customer-feedback-labels";
import { mergeFeedbackActivity, type FeedbackActivityItem } from "@/lib/feedback-activity";

type Props = {
  row: CustomerFeedbackRow;
  onPosted?: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function commentBadgeClass(kind: FeedbackCommentKind): string {
  if (kind === "issue") return "bg-amber-500/15 text-amber-800 border-amber-500/30";
  if (kind === "fix") return "bg-emerald-500/15 text-emerald-800 border-emerald-500/30";
  return "bg-secondary text-secondary-foreground";
}

function ActivityRow({ item }: { item: FeedbackActivityItem }) {
  if (item.type === "system") {
    const label = TIMELINE_EVENT_LABELS[item.event] ?? item.event;
    const text = item.message ?? label;
    return (
      <li className="flex gap-2 text-xs py-2 border-b border-border/40 last:border-0">
        <div className="mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
          <MessageSquare className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground">
            <span className="text-card-foreground font-medium">{formatFeedbackDate(item.createdAt)}</span>
            {item.actorName ? ` · ${item.actorName}` : null}
          </p>
          <p className="text-card-foreground mt-0.5">{text}</p>
          <Badge variant="outline" className="mt-1 text-[10px]">
            Hệ thống
          </Badge>
        </div>
      </li>
    );
  }

  return (
    <li className="flex gap-2 text-sm py-2 border-b border-border/40 last:border-0">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{initials(item.authorName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-card-foreground">{item.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatFeedbackDate(item.createdAt)}</span>
          <Badge variant="outline" className={cn("text-[10px]", commentBadgeClass(item.kind))}>
            {COMMENT_KIND_LABELS[item.kind]}
          </Badge>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-card-foreground">{item.body}</p>
      </div>
    </li>
  );
}

export function FeedbackActivitySection({ row, onPosted }: Props) {
  const createMut = useCreateFeedbackComment();
  const [kind, setKind] = useState<"issue" | "fix">("issue");
  const [body, setBody] = useState("");

  const items = useMemo(
    () => mergeFeedbackActivity(row.timeline ?? [], row.comments ?? []),
    [row.timeline, row.comments],
  );

  const canComment = row.canComment === true;

  const placeholders = {
    issue: "Mô tả hỏng hóc, linh kiện hoặc triệu chứng…",
    fix: "Đã thay/sửa gì, kết quả kiểm tra…",
  };

  const onSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      toast.error("Vui lòng nhập nội dung cập nhật");
      return;
    }
    try {
      await createMut.mutateAsync({ feedbackId: row.id, kind, body: trimmed });
      setBody("");
      toast.success("Đã ghi cập nhật");
      onPosted?.();
    } catch (e) {
      toastApiError(e, "Không gửi được cập nhật");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-card/30 p-4">
      <Label className="text-sm font-semibold text-card-foreground">Hoạt động & cập nhật xử lý</Label>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
      ) : (
        <ScrollArea className="max-h-[320px] pr-3">
          <ul>{items.map((item) => <ActivityRow key={`${item.type}-${item.id}`} item={item} />)}</ul>
        </ScrollArea>
      )}

      {canComment ? (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={kind === "issue" ? "default" : "outline"}
              onClick={() => setKind("issue")}
              disabled={createMut.isPending}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Ghi sự cố
            </Button>
            <Button
              type="button"
              size="sm"
              variant={kind === "fix" ? "default" : "outline"}
              onClick={() => setKind("fix")}
              disabled={createMut.isPending}
            >
              <Wrench className="h-3.5 w-3.5 mr-1" />
              Ghi kết quả sửa
            </Button>
          </div>
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholders[kind]}
            disabled={createMut.isPending}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => void onSubmit()} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Gửi cập nhật
            </Button>
          </div>
        </div>
      ) : row.status === "resolved" ? (
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          Phản ánh đã đóng — chỉ quản trị viên có thể ghi thêm cập nhật.
        </p>
      ) : null}
    </div>
  );
}
