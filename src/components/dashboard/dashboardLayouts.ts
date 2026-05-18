import type { WidgetConfig } from "./DashboardGrid";

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

/** Xếp widget theo hàng, không chồng lấn, lấp đầy 12 cột */
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

    items.push({
      i: widget.id,
      x: rowX,
      y,
      w,
      h,
      minW: widget.defaultLayout.minW ?? 2,
      minH: widget.defaultLayout.minH ?? 2,
    });

    rowX += w;
    rowMaxH = Math.max(rowMaxH, h);
  }

  return items;
}

/** Bố cục mặc định CEO Dashboard — không chồng, đủ chiều cao hiển thị */
/** CEO Dashboard — 7 nhánh sơ đồ + biểu đồ/bảng bổ sung */
export const OVERVIEW_LAYOUT_PRESETS: Record<string, { x: number; y: number; w: number; h: number; minH?: number }> = {
  stats: { x: 0, y: 0, w: 12, h: 2, minH: 2 },
  "product-manufacturing": { x: 0, y: 2, w: 12, h: 5, minH: 4 },
  "progress-contract": { x: 0, y: 7, w: 4, h: 4, minH: 3 },
  "progress-handover": { x: 4, y: 7, w: 4, h: 4, minH: 3 },
  "progress-training": { x: 8, y: 7, w: 4, h: 4, minH: 3 },
  complaint: { x: 0, y: 11, w: 6, h: 4, minH: 3 },
  pakd: { x: 6, y: 11, w: 6, h: 6, minH: 5 },
  "customer-care": { x: 0, y: 17, w: 12, h: 5, minH: 4 },
  "chart-customer-revenue": { x: 0, y: 22, w: 6, h: 4, minH: 3 },
  trend: { x: 6, y: 22, w: 6, h: 4, minH: 3 },
  "table-contracts": { x: 0, y: 26, w: 12, h: 5, minH: 4 },
};

/** Tab Khách hàng — đủ cao cho thẻ KPI và biểu đồ */
export const CUSTOMER_LAYOUT_PRESETS: Record<string, { x: number; y: number; w: number; h: number; minH?: number }> = {
  stats: { x: 0, y: 0, w: 12, h: 3, minH: 3 },
  "chart-product": { x: 0, y: 3, w: 6, h: 6, minH: 5 },
  "chart-revenue": { x: 6, y: 3, w: 6, h: 6, minH: 5 },
  "pie-product": { x: 0, y: 9, w: 6, h: 5, minH: 4 },
  "pie-revenue": { x: 6, y: 9, w: 6, h: 5, minH: 4 },
  "customer-care": { x: 0, y: 14, w: 12, h: 5, minH: 4 },
  table: { x: 0, y: 19, w: 12, h: 6, minH: 5 },
};

export function buildPresetLayouts(
  widgets: WidgetConfig[],
  presets: Record<string, { x: number; y: number; w: number; h: number; minH?: number }>,
): GridLayoutItem[] {
  const used = new Set<string>();
  const placed: GridLayoutItem[] = [];

  for (const widget of widgets) {
    const preset = presets[widget.id];
    if (preset) {
      placed.push({
        i: widget.id,
        x: preset.x,
        y: preset.y,
        w: preset.w,
        h: preset.h,
        minW: widget.defaultLayout.minW ?? 3,
        minH: preset.minH ?? widget.defaultLayout.minH ?? 2,
      });
      used.add(widget.id);
    }
  }

  const rest = widgets.filter((w) => !used.has(w.id));
  if (rest.length === 0) return placed;

  const maxY = placed.reduce((m, l) => Math.max(m, l.y + l.h), 0);
  const packed = packWidgetLayouts(rest).map((l) => ({ ...l, y: l.y + maxY }));
  return [...placed, ...packed];
}

export function buildCustomerLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildPresetLayouts(widgets, CUSTOMER_LAYOUT_PRESETS);
}

export function buildOverviewLayouts(widgets: WidgetConfig[]): GridLayoutItem[] {
  return buildPresetLayouts(widgets, OVERVIEW_LAYOUT_PRESETS);
}
