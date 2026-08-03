import { useState, useCallback, useEffect } from "react";
import { persistActiveWidgetIds, readActiveWidgetIds } from "@/lib/dashboard-layout-export";
import { getDefaultActiveWidgetIds } from "@/components/dashboard/dashboardLayouts";

export function useDashboardActiveWidgets(storageKey: string, defaultIds: string[]) {
  const codeDefaults = getDefaultActiveWidgetIds(storageKey, defaultIds);
  const [activeWidgetIds, setActiveWidgetIdsState] = useState<string[]>(() =>
    readActiveWidgetIds(storageKey, codeDefaults),
  );

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey: string }>).detail;
      if (detail?.storageKey !== storageKey) return;
      setActiveWidgetIdsState(codeDefaults);
      persistActiveWidgetIds(storageKey, codeDefaults);
    };
    window.addEventListener("dashboard-layout-reset", handler);
    return () => window.removeEventListener("dashboard-layout-reset", handler);
  }, [storageKey, codeDefaults]);

  const setActiveWidgetIds = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      setActiveWidgetIdsState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        persistActiveWidgetIds(storageKey, resolved);
        return resolved;
      });
    },
    [storageKey],
  );

  const addWidget = useCallback(
    (id: string) => {
      setActiveWidgetIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    [setActiveWidgetIds],
  );

  return { activeWidgetIds, setActiveWidgetIds, addWidget };
}
