import type { ReactNode } from "react";

type AttributeSettingsLayoutProps = {
  nav: ReactNode;
  children: ReactNode;
};

export function AttributeSettingsLayout({ nav, children }: AttributeSettingsLayoutProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      <aside className="w-full shrink-0 lg:w-56 xl:w-64">{nav}</aside>
      <div className="min-w-0 flex-1 space-y-4">{children}</div>
    </div>
  );
}
