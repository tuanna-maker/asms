import { createContext, useContext, type ReactNode } from "react";

type DashboardFullscreenContextValue = {
  isFullscreen: boolean;
};

const DashboardFullscreenContext = createContext<DashboardFullscreenContextValue>({
  isFullscreen: false,
});

export function DashboardFullscreenProvider({
  isFullscreen,
  children,
}: {
  isFullscreen: boolean;
  children: ReactNode;
}) {
  return (
    <DashboardFullscreenContext.Provider value={{ isFullscreen }}>
      {children}
    </DashboardFullscreenContext.Provider>
  );
}

export function useDashboardFullscreen() {
  return useContext(DashboardFullscreenContext);
}
