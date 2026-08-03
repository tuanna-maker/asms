import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Responsive, verticalCompactor } from "react-grid-layout";
import {
  packWidgetLayouts,
  buildFullscreenLayoutsForStorageKey,
  type GridLayoutItem,
} from "./dashboardLayouts";
import { Plus, Lock, Unlock, RotateCcw, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDashboardFullscreen } from "@/hooks/use-dashboard-fullscreen";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

export type LayoutItem = GridLayoutItem;

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  component: React.ReactNode;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
  /** Mặc định hidden — không cuộn trong ô; stats dùng visible */
  contentOverflow?: "hidden" | "visible";
}

interface DashboardGridProps {
  widgets: WidgetConfig[];
  availableWidgets?: WidgetConfig[];
  storageKey: string;
  onAddWidget?: () => void;
  /** Tuỳ chỉnh hàm tạo layout mặc định (vd. overview có preset cố định) */
  buildDefaultLayouts?: (widgets: WidgetConfig[]) => LayoutItem[];
}

/** Một breakpoint duy nhất — tránh F12/resize đổi breakpoint rồi ghi đè layout */
const BREAKPOINTS = { lg: 0 };
const COLS = { lg: 12 };
const ROW_HEIGHT_DESKTOP = 88;
const ROW_HEIGHT_MOBILE = 76;
const FULLSCREEN_GRID_GAP = 4;
const FULLSCREEN_ROW_HEIGHT_MIN = 36;
const FULLSCREEN_ROW_HEIGHT_MAX = 72;
const LAYOUT_VERSION_SUFFIX = "-layout-v7";
const MIN_WIDGET_W = 1;
const MIN_WIDGET_H = 1;
const MAX_WIDGET_W = 12;
const MIN_MEASURED_WIDTH = 200;

function normalizeLayoutItems(items: LayoutItem[]): LayoutItem[] {
  return items.map((item) => ({
    ...item,
    minW: MIN_WIDGET_W,
    minH: MIN_WIDGET_H,
    maxW: MAX_WIDGET_W,
  }));
}

function countLayoutRows(items: LayoutItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.y + item.h), 0);
}

const DashboardGrid = ({ widgets, storageKey, onAddWidget, buildDefaultLayouts }: DashboardGridProps) => {
  const { isFullscreen } = useDashboardFullscreen();
  const layoutStorageKey = `${storageKey}${LAYOUT_VERSION_SUFFIX}`;
  const makeDefaultLayouts = buildDefaultLayouts ?? packWidgetLayouts;
  const isMobile = useIsMobile();
  const rootRef = useRef<HTMLDivElement>(null);
  const gridAreaRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1280);
  const [gridAreaHeight, setGridAreaHeight] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(false);
  const presentationMode = isFullscreen && !isEditing;
  isEditingRef.current = isEditing;

  // Đo width ổn định — bỏ qua giá trị quá nhỏ khi DevTools/tab ẩn tạm thời
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const applyWidth = (raw: number) => {
      if (raw < MIN_MEASURED_WIDTH) return;
      setContainerWidth((prev) => (Math.abs(prev - raw) < 1 ? prev : raw));
    };

    const measure = () => applyWidth(node.getBoundingClientRect().width);

    measure();
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      applyWidth(w);
    });
    observer.observe(node);

    const onWinResize = () => {
      requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onWinResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, []);
  const gridGapStorageKey = `${storageKey}-grid-gap`;
  const [gridGap, setGridGap] = useState(() => {
    try {
      const saved = localStorage.getItem(gridGapStorageKey);
      if (saved) {
        const n = Number(saved);
        if (!Number.isNaN(n) && n >= 4 && n <= 24) return n;
      }
    } catch {
      // ignore
    }
    return 8;
  });
  const [removedWidgets, setRemovedWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${storageKey}-removed`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [layouts, setLayouts] = useState<LayoutItem[]>(() => {
    try {
      const saved = localStorage.getItem(layoutStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as LayoutItem[];
        const widgetIds = widgets.map((w) => w.id);
        const validLayouts = parsed.filter((l) => widgetIds.includes(l.i));
        const savedIds = validLayouts.map((l) => l.i);
        const newWidgets = widgets.filter((w) => !savedIds.includes(w.id));
        return normalizeLayoutItems([
          ...validLayouts,
          ...makeDefaultLayouts(newWidgets),
        ]);
      }
    } catch {
      // ignore parse errors and fall through to defaults
    }
    return normalizeLayoutItems(makeDefaultLayouts(widgets));
  });

  const visibleWidgets = useMemo(
    () => widgets.filter(w => !removedWidgets.includes(w.id)),
    [widgets, removedWidgets]
  );

  const visibleLayouts = useMemo(
    () => normalizeLayoutItems(layouts.filter(l => !removedWidgets.includes(l.i))),
    [layouts, removedWidgets]
  );

  const displayLayouts = useMemo(() => {
    if (!presentationMode) return visibleLayouts;
    const widgetIds = visibleWidgets.map((w) => w.id);
    const fullscreenLayouts = buildFullscreenLayoutsForStorageKey(widgetIds, storageKey);
    return fullscreenLayouts.length > 0 ? fullscreenLayouts : visibleLayouts;
  }, [presentationMode, visibleLayouts, visibleWidgets, storageKey]);

  const activeGridGap = presentationMode ? FULLSCREEN_GRID_GAP : gridGap;
  const totalGridRows = countLayoutRows(displayLayouts);

  const rowHeight = useMemo(() => {
    if (!presentationMode || gridAreaHeight <= 0 || totalGridRows === 0) {
      return isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP;
    }
    const gapTotal = (totalGridRows + 1) * activeGridGap;
    const computed = Math.floor((gridAreaHeight - gapTotal) / totalGridRows);
    return Math.max(FULLSCREEN_ROW_HEIGHT_MIN, Math.min(FULLSCREEN_ROW_HEIGHT_MAX, computed));
  }, [presentationMode, gridAreaHeight, totalGridRows, activeGridGap, isMobile]);

  useEffect(() => {
    if (!presentationMode || !gridAreaRef.current) {
      setGridAreaHeight(0);
      return;
    }
    const node = gridAreaRef.current;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setGridAreaHeight(height);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [presentationMode]);

  useEffect(() => {
    if (isFullscreen) setIsEditing(false);
  }, [isFullscreen]);

  // Sync when widgets change
  useEffect(() => {
    const currentIds = layouts.map(l => l.i);
    const newWidgets = widgets.filter(w => !currentIds.includes(w.id));
    if (newWidgets.length > 0) {
      setLayouts((prev) =>
        normalizeLayoutItems([...prev, ...makeDefaultLayouts(newWidgets)]),
      );
    }
  }, [widgets, makeDefaultLayouts]);

  /** Chỉ lưu khi user đang chỉnh sửa — tránh F12/resize ghi đè layout */
  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    if (presentationMode || !isEditingRef.current) return;
    const normalized = normalizeLayoutItems(newLayout);
    setLayouts(normalized);
    localStorage.setItem(layoutStorageKey, JSON.stringify(normalized));
  }, [layoutStorageKey, presentationMode]);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setRemovedWidgets(prev => {
      const next = [...prev, widgetId];
      localStorage.setItem(`${storageKey}-removed`, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const handleRestoreWidget = useCallback((widgetId: string) => {
    setRemovedWidgets(prev => {
      const next = prev.filter(id => id !== widgetId);
      localStorage.setItem(`${storageKey}-removed`, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const handleReset = useCallback(() => {
    const defaultLayouts = normalizeLayoutItems(makeDefaultLayouts(widgets));
    setLayouts(defaultLayouts);
    setRemovedWidgets([]);
    localStorage.removeItem(layoutStorageKey);
    localStorage.removeItem(`${storageKey}-removed`);
    localStorage.removeItem(`${storageKey}-layouts`);
    localStorage.removeItem(`${storageKey}-active-widgets`);
    window.dispatchEvent(new CustomEvent("dashboard-layout-reset", { detail: { storageKey } }));
  }, [widgets, storageKey, layoutStorageKey, makeDefaultLayouts]);

  const handleGridGapChange = useCallback(
    (value: number) => {
      setGridGap(value);
      localStorage.setItem(gridGapStorageKey, String(value));
    },
    [gridGapStorageKey],
  );

  const hiddenWidgets = widgets.filter(w => removedWidgets.includes(w.id));

  return (
    <div
      ref={rootRef}
      className={presentationMode ? "h-full min-h-0 flex flex-col w-full" : "space-y-3 w-full"}
    >
      {/* Toolbar — ẩn khi trình chiếu toàn màn hình */}
      {!presentationMode && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="gap-1.5"
              >
                {isEditing ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {isEditing ? "Đang chỉnh sửa" : "Chỉnh sửa bố cục"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isEditing ? "Khóa bố cục" : "Mở chế độ kéo thả & chỉnh kích thước"}</TooltipContent>
          </Tooltip>

          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Đặt lại
              </Button>
              {onAddWidget && (
                <Button variant="outline" size="sm" onClick={onAddWidget} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Thêm widget
                </Button>
              )}
              <div className="flex items-center gap-2 ml-1 min-w-[10rem]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Khoảng cách</span>
                <input
                  type="range"
                  min={4}
                  max={24}
                  step={2}
                  value={gridGap}
                  onChange={(e) => handleGridGapChange(Number(e.target.value))}
                  className="w-24 accent-primary"
                  aria-label="Khoảng cách giữa các ô"
                />
                <span className="text-xs tabular-nums text-muted-foreground w-6">{gridGap}px</span>
              </div>
            </>
          )}

          {isEditing && hiddenWidgets.length > 0 && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs text-muted-foreground">Đã ẩn:</span>
              {hiddenWidgets.map(w => (
                <Badge
                  key={w.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 text-xs gap-1"
                  onClick={() => handleRestoreWidget(w.id)}
                >
                  <Plus className="h-3 w-3" /> {w.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridAreaRef}
        className={presentationMode ? "flex-1 min-h-0 w-full" : "w-full"}
      >
        <Responsive
          className={`dashboard-grid${presentationMode ? " dashboard-grid--fullscreen" : ""}`}
          breakpoints={BREAKPOINTS}
          layouts={{ lg: displayLayouts }}
          cols={COLS}
          rowHeight={rowHeight}
          width={containerWidth}
          dragConfig={{ enabled: isEditing && !presentationMode, handle: ".drag-handle" }}
          resizeConfig={{ enabled: isEditing && !presentationMode }}
          onLayoutChange={handleLayoutChange}
          compactor={verticalCompactor}
          margin={[activeGridGap, activeGridGap] as const}
          containerPadding={[0, 0] as const}
        >
          {visibleWidgets.map(widget => (
            <div key={widget.id} className="relative group/widget h-full min-h-0">
              {isEditing && !presentationMode && (
                <>
                  <div className="drag-handle absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing p-1 rounded bg-muted/80 opacity-0 group-hover/widget:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <button
                    onClick={() => handleRemoveWidget(widget.id)}
                    className="absolute top-2 right-2 z-20 p-1 rounded bg-destructive/10 text-destructive opacity-0 group-hover/widget:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <div
                className={`h-full w-full min-h-0 flex flex-col ${
                  presentationMode ? "justify-start" : "justify-center"
                } ${
                  widget.contentOverflow === "visible" ? "overflow-visible" : "overflow-hidden"
                } ${isEditing && !presentationMode ? "ring-1 ring-dashed ring-border rounded-xl" : ""}`}
              >
                {widget.component}
              </div>
            </div>
          ))}
        </Responsive>
      </div>
    </div>
  );
};

export default DashboardGrid;
