import type {
  FeedbackComment,
  FeedbackCommentKind,
  FeedbackTimelineEvent,
} from "@/hooks/use-customer-feedbacks-api";

export type FeedbackActivityItem =
  | {
      type: "system";
      id: string;
      createdAt: string;
      event: string;
      message: string | null;
      actorName: string | null;
    }
  | {
      type: "comment";
      id: string;
      createdAt: string;
      kind: FeedbackCommentKind;
      body: string;
      authorName: string;
    };

export function mergeFeedbackActivity(
  timeline: FeedbackTimelineEvent[] = [],
  comments: FeedbackComment[] = [],
): FeedbackActivityItem[] {
  const system: FeedbackActivityItem[] = timeline.map((t) => ({
    type: "system" as const,
    id: t.id,
    createdAt: t.createdAt,
    event: t.event,
    message: t.message,
    actorName: t.actor?.fullName ?? null,
  }));
  const userComments: FeedbackActivityItem[] = comments.map((c) => ({
    type: "comment" as const,
    id: c.id,
    createdAt: c.createdAt,
    kind: c.kind,
    body: c.body,
    authorName: c.author.fullName,
  }));
  return [...system, ...userComments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
