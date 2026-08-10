import type { WidgetConfig } from "./DashboardGrid";

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
};

type LayoutPos = Pick<GridLayoutItem, "i" | "x" | "y" | "w" | "h">;

const MIN_W = 1;
const MIN_H = 1;
const MAX_W = 12;

/** Bố cục mặc định đã export — cập nhật từ file *-default-layout.json */
export const DASHBOARD_DEFAULT_ACTIVE_WIDGETS: Record<string, string[]> = {
  "overview-dashboard": [
    "stats",
    "product-manufacturing",
    "progress-contract",
    "progress-handover",
    "progress-training",
    "complaint",
    "pakd",
    "chart-customer-revenue",
    "trend",
    "table-contracts",
  ],
  "customer-dashboard": ["stats", "chart-product", "chart-revenue", "customer-care"],
  "revenue-dashboard": ["stats", "chart-revenue", "pie-revenue", "trend", "table"],
  "project-dashboard": [
    "stats",
    "progress-contract",
    "progress-handover",
    "progress-training",
    "pie-contract",
    "complaint",
    "pakd",
    "trend",
    "table-contract",
    "table-handover",
    "table-training",
  ],
  "product-dashboard": ["stats", "manufacturing", "progress", "pie", "chart-customer", "trend", "table"],
  "warranty-dashboard": ["stats", "complaint", "pie-type", "progress", "pie-status", "trend", "table"],
};

const DASHBOARD_DEFAULT_LAYOUTS: Record<string, LayoutPos[]> = {
  "overview-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "product-manufacturing", x: 0, y: 1, w: 12, h: 4 },
    { i: "progress-contract", x: 0, y: 5, w: 4, h: 3 },
    { i: "progress-handover", x: 4, y: 5, w: 4, h: 3 },
    { i: "progress-training", x: 8, y: 5, w: 4, h: 3 },
    { i: "complaint", x: 0, y: 8, w: 6, h: 3 },
    { i: "pakd", x: 6, y: 8, w: 6, h: 3 },
    { i: "chart-customer-revenue", x: 0, y: 11, w: 6, h: 4 },
    { i: "trend", x: 6, y: 11, w: 6, h: 4 },
    { i: "table-contracts", x: 0, y: 15, w: 12, h: 5 },
  ],
  "customer-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "chart-product", x: 0, y: 1, w: 6, h: 6 },
    { i: "chart-revenue", x: 6, y: 1, w: 6, h: 6 },
    { i: "customer-care", x: 0, y: 7, w: 12, h: 3 },
  ],
  "revenue-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "chart-revenue", x: 0, y: 1, w: 12, h: 4 },
    { i: "pie-revenue", x: 0, y: 5, w: 6, h: 4 },
    { i: "trend", x: 6, y: 5, w: 6, h: 4 },
    { i: "table", x: 0, y: 9, w: 12, h: 4 },
  ],
  "project-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "progress-contract", x: 0, y: 1, w: 6, h: 3 },
    { i: "progress-handover", x: 6, y: 1, w: 6, h: 3 },
    { i: "progress-training", x: 0, y: 4, w: 6, h: 3 },
    { i: "pie-contract", x: 6, y: 4, w: 6, h: 4 },
    { i: "complaint", x: 0, y: 7, w: 6, h: 4 },
    { i: "pakd", x: 6, y: 8, w: 6, h: 3 },
    { i: "trend", x: 0, y: 11, w: 12, h: 5 },
    { i: "table-contract", x: 0, y: 16, w: 12, h: 5 },
    { i: "table-handover", x: 0, y: 21, w: 12, h: 5 },
    { i: "table-training", x: 0, y: 26, w: 12, h: 5 },
  ],
  "product-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "manufacturing", x: 0, y: 1, w: 12, h: 4 },
    { i: "progress", x: 0, y: 5, w: 6, h: 3 },
    { i: "pie", x: 6, y: 5, w: 6, h: 3 },
    { i: "chart-customer", x: 0, y: 8, w: 6, h: 4 },
    { i: "trend", x: 6, y: 8, w: 6, h: 4 },
    { i: "table", x: 0, y: 12, w: 12, h: 5 },
  ],
  "warranty-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "complaint", x: 0, y: 1, w: 6, h: 4 },
    { i: "pie-type", x: 6, y: 1, w: 6, h: 3 },
    { i: "progress", x: 0, y: 5, w: 6, h: 3 },
    { i: "pie-status", x: 6, y: 4, w: 6, h: 4 },
    { i: "trend", x: 0, y: 8, w: 12, h: 5 },
    { i: "table", x: 0, y: 13, w: 12, h: 5 },
  ],
};

/** Bố cục compact cho chế độ toàn màn hình / trình chiếu (~9 hàng → ô đủ cao, ít khoảng trống đáy) */
const DASHBOARD_FULLSCREEN_LAYOUTS: Record<string, LayoutPos[]> = {
  "overview-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "progress-contract", x: 0, y: 1, w: 4, h: 2 },
    { i: "progress-handover", x: 4, y: 1, w: 4, h: 2 },
    { i: "progress-training", x: 8, y: 1, w: 4, h: 2 },
    { i: "product-manufacturing", x: 0, y: 3, w: 7, h: 3 },
    { i: "complaint", x: 7, y: 3, w: 5, h: 2 },
    { i: "pakd", x: 7, y: 5, w: 5, h: 1 },
    { i: "chart-customer-revenue", x: 0, y: 6, w: 6, h: 2 },
    { i: "trend", x: 6, y: 6, w: 6, h: 2 },
    { i: "table-contracts", x: 0, y: 8, w: 12, h: 2 },
  ],
  "customer-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "chart-product", x: 0, y: 1, w: 4, h: 4 },
    { i: "chart-revenue", x: 4, y: 1, w: 4, h: 4 },
    { i: "customer-care", x: 8, y: 1, w: 4, h: 4 },
  ],
  "revenue-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "chart-revenue", x: 0, y: 1, w: 8, h: 3 },
    { i: "pie-revenue", x: 8, y: 1, w: 4, h: 3 },
    { i: "trend", x: 0, y: 4, w: 6, h: 3 },
    { i: "table", x: 6, y: 4, w: 6, h: 3 },
  ],
  "project-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "progress-contract", x: 0, y: 1, w: 4, h: 2 },
    { i: "progress-handover", x: 4, y: 1, w: 4, h: 2 },
    { i: "progress-training", x: 8, y: 1, w: 4, h: 2 },
    { i: "pie-contract", x: 0, y: 3, w: 4, h: 2 },
    { i: "complaint", x: 4, y: 3, w: 4, h: 2 },
    { i: "pakd", x: 8, y: 3, w: 4, h: 2 },
    { i: "trend", x: 0, y: 5, w: 12, h: 3 },
    { i: "table-contract", x: 0, y: 8, w: 4, h: 3 },
    { i: "table-handover", x: 4, y: 8, w: 4, h: 3 },
    { i: "table-training", x: 8, y: 8, w: 4, h: 3 },
  ],
  "product-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "manufacturing", x: 0, y: 1, w: 6, h: 3 },
    { i: "progress", x: 6, y: 1, w: 3, h: 3 },
    { i: "pie", x: 9, y: 1, w: 3, h: 3 },
    { i: "chart-customer", x: 0, y: 4, w: 6, h: 3 },
    { i: "trend", x: 6, y: 4, w: 6, h: 3 },
    { i: "table", x: 0, y: 7, w: 12, h: 3 },
  ],
  "warranty-dashboard": [
    { i: "stats", x: 0, y: 0, w: 12, h: 1 },
    { i: "complaint", x: 0, y: 1, w: 4, h: 3 },
    { i: "pie-type", x: 4, y: 1, w: 4, h: 3 },
    { i: "progress", x: 8, y: 1, w: 4, h: 3 },
    { i: "pie-status", x: 0, y: 4, w: 4, h: 3 },
    { i: "trend", x: 4, y: 4, w: 8, h: 3 },
    { i: "table", x: 0, y: 7, w: 12, h: 3 },
  ],
};

function withGridConstraints(item: LayoutPos): GridLayoutItem {
  return { ...item, minW: MIN_W, minH: MIN_H, maxW: MAX_W };
}

/** Xếp widget theo hàng khi không có preset */
export function packWidgetLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  const COLS = 12;
  let y = 0;
  let rowX = 0;
  let rowMaxH = 0;
  const items: GridLayoutItem[] = [];

  for (const widget of widgets) {
    const w = widget.defaultLayout.w;
    const h = widget.defaultLayout.h;

    if (rowX > 0 && rowX + w > COLS) {
      y += rowMaxH;
      rowX = 0;
      rowMaxH = 0;
    }

    items.push(withGridConstraints({ i: widget.id, x: rowX, y, w, h }));
    rowX += w;
    rowMaxH = Math.max(rowMaxH, h);
  }

  return items;
}

export function buildDefaultLayoutsForStorageKey(
  widgets: WidgetConfig[],
  storageKey: string,
): GridLayoutItem[] {
  const defaults = DASHBOARD_DEFAULT_LAYOUTS[storageKey];
  if (!defaults) return packWidgetLayouts(widgets);

  const presetById = new Map(defaults.map((d) => [d.i, d]));
  const placed: GridLayoutItem[] = [];

  for (const widget of widgets) {
    const preset = presetById.get(widget.id);
    if (preset) {
      placed.push(withGridConstraints(preset));
    }
  }

  const rest = widgets.filter((w) => !presetById.has(w.id));
  if (rest.length === 0) return placed;

  const maxY = placed.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  const packed = packWidgetLayouts(rest).map((l) => ({ ...l, y: l.y + maxY }));
  return [...placed, ...packed];
}

export function buildOverviewLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "overview-dashboard");
}

export function buildCustomerLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "customer-dashboard");
}

export function buildRevenueLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "revenue-dashboard");
}

export function buildProjectLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "project-dashboard");
}

export function buildProductLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "product-dashboard");
}

export function buildWarrantyLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildDefaultLayoutsForStorageKey(widgets, "warranty-dashboard");
}

export function buildFullscreenLayoutsForStorageKey(
  widgetIds: string[],
  storageKey: string,
): GridLayoutItem[] {
  const presets = DASHBOARD_FULLSCREEN_LAYOUTS[storageKey];
  if (!presets) return [];

  const idSet = new Set(widgetIds);
  return presets.filter((p) => idSet.has(p.i)).map(withGridConstraints);
}

export function getDefaultActiveWidgetIds(storageKey: string, fallback: string[]): string[] {
  return DASHBOARD_DEFAULT_ACTIVE_WIDGETS[storageKey] ?? fallback;
}
