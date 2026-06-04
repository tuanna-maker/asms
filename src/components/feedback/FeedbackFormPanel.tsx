import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FeedbackFormPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-card/30 p-4 sm:p-6 flex flex-col max-w-6xl w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FeedbackFormSection({
  title,
  description,
  children,
  className,
  noDivider,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  noDivider?: boolean;
}) {
  return (
    <section
      className={cn(
        "space-y-4 py-5 first:pt-0 last:pb-0",
        !noDivider && "border-b border-border/40 last:border-b-0",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FeedbackFormFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 pt-5 mt-1 border-t border-border/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FeedbackFormSteps({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 pb-5 mb-1 border-b border-border/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
