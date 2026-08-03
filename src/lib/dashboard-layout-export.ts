import type { GridLayoutItem } from "@/components/dashboard/dashboardLayouts";

export const DASHBOARD_LAYOUT_VERSION_SUFFIX = "-layout-v7";

export const DASHBOARD_GRID_STORAGE_KEYS = [
  "overview-dashboard",
  "customer-dashboard",
  "revenue-dashboard",
  "project-dashboard",
  "product-dashboard",
  "warranty-dashboard",
] as const;

export type DashboardGridStorageKey = (typeof DASHBOARD_GRID_STORAGE_KEYS)[number];

export type DashboardTabLayoutExport = {
  storageKey: string;
  layouts: Array<Pick<GridLayoutItem, "i" | "x" | "y" | "w" | "h">>;
  removed: string[];
  activeWidgetIds: string[];
};

export type DashboardLayoutsExport = {
  version: 1;
  exportedAt: string;
  tabs: Record<string, DashboardTabLayoutExport>;
};

const PENDING_EXPORT_KEY = "dashboard-pending-default-export";

function stripLayoutItem(item: GridLayoutItem): Pick<GridLayoutItem, "i" | "x" | "y" | "w" | "h"> {
  return { i: item.i, x: item.x, y: item.y, w: item.w, h: item.h };
}

export function readTabLayoutFromStorage(storageKey: string): DashboardTabLayoutExport | null {
  try {
    const layoutsRaw = localStorage.getItem(`${storageKey}${DASHBOARD_LAYOUT_VERSION_SUFFIX}`);
    const removedRaw = localStorage.getItem(`${storageKey}-removed`);
    const activeRaw = localStorage.getItem(`${storageKey}-active-widgets`);
    if (!layoutsRaw && !activeRaw) return null;

    const layouts = layoutsRaw ? (JSON.parse(layoutsRaw) as GridLayoutItem[]) : [];
    const removed = removedRaw ? (JSON.parse(removedRaw) as string[]) : [];
    const activeWidgetIds = activeRaw
      ? (JSON.parse(activeRaw) as string[])
      : layouts.map((l) => l.i);

    return {
      storageKey,
      layouts: layouts.map(stripLayoutItem),
      removed,
      activeWidgetIds,
    };
  } catch {
    return null;
  }
}

export function buildTabLayoutExport(
  storageKey: string,
  layouts: GridLayoutItem[],
  removed: string[],
  activeWidgetIds: string[],
): DashboardTabLayoutExport {
  return {
    storageKey,
    layouts: layouts.map(stripLayoutItem),
    removed,
    activeWidgetIds,
  };
}

function mergePendingExport(tab: DashboardTabLayoutExport): void {
  try {
    const raw = localStorage.getItem(PENDING_EXPORT_KEY);
    const existing = raw ? (JSON.parse(raw) as DashboardLayoutsExport) : null;
    const next: DashboardLayoutsExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tabs: { ...(existing?.tabs ?? {}), [tab.storageKey]: tab },
    };
    localStorage.setItem(PENDING_EXPORT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function readPendingExport(): DashboardLayoutsExport | null {
  try {
    const raw = localStorage.getItem(PENDING_EXPORT_KEY);
    return raw ? (JSON.parse(raw) as DashboardLayoutsExport) : null;
  } catch {
    return null;
  }
}

export function exportAllDashboardLayoutsFromStorage(): DashboardLayoutsExport {
  const pending = readPendingExport();
  const tabs: Record<string, DashboardTabLayoutExport> = { ...(pending?.tabs ?? {}) };

  for (const storageKey of DASHBOARD_GRID_STORAGE_KEYS) {
    const fromStorage = readTabLayoutFromStorage(storageKey);
    if (fromStorage) {
      tabs[storageKey] = fromStorage;
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tabs,
  };
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function saveTabLayoutAsDefault(tab: DashboardTabLayoutExport): void {
  mergePendingExport(tab);
  downloadJson(`${tab.storageKey}-default-layout.json`, tab);
}

export function saveAllDashboardLayoutsAsDefault(): DashboardLayoutsExport {
  const payload = exportAllDashboardLayoutsFromStorage();
  localStorage.setItem(PENDING_EXPORT_KEY, JSON.stringify(payload));
  downloadJson("dashboard-layouts-export.json", payload);
  return payload;
}

export function persistActiveWidgetIds(storageKey: string, activeWidgetIds: string[]): void {
  localStorage.setItem(`${storageKey}-active-widgets`, JSON.stringify(activeWidgetIds));
}

export function readActiveWidgetIds(storageKey: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(`${storageKey}-active-widgets`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}
