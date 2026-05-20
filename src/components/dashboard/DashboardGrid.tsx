import { useState, useCallback, useMemo, useEffect } from "react";
import { Responsive, useContainerWidth, verticalCompactor } from "react-grid-layout";
import { packWidgetLayouts, type GridLayoutItem } from "./dashboardLayouts";
import { Plus, Lock, Unlock, RotateCcw, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
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

const COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };
const ROW_HEIGHT_DESKTOP = 88;
const ROW_HEIGHT_MOBILE = 76;
const LAYOUT_VERSION_SUFFIX = "-layout-v5";
const DashboardGrid = ({ widgets, storageKey, onAddWidget, buildDefaultLayouts }: DashboardGridProps) => {
  const layoutStorageKey = `${storageKey}${LAYOUT_VERSION_SUFFIX}`;
  const makeDefaultLayouts = buildDefaultLayouts ?? packWidgetLayouts;
  const isMobile = useIsMobile();
  const containerHook = useContainerWidth as unknown as (
    opts: { initialWidth: number },
  ) => { width: number; containerRef: React.RefObject<HTMLDivElement> };
  const { width: containerWidth, containerRef } = containerHook({ initialWidth: 1280 });
  const [isEditing, setIsEditing] = useState(false);
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
        return [...validLayouts, ...makeDefaultLayouts(newWidgets)];
      }
    } catch {
      // ignore parse errors and fall through to defaults
    }
    return makeDefaultLayouts(widgets);
  });

  const visibleWidgets = useMemo(
    () => widgets.filter(w => !removedWidgets.includes(w.id)),
    [widgets, removedWidgets]
  );

  const visibleLayouts = useMemo(
    () => layouts.filter(l => !removedWidgets.includes(l.i)),
    [layouts, removedWidgets]
  );

  // Sync when widgets change
  useEffect(() => {
    const currentIds = layouts.map(l => l.i);
    const newWidgets = widgets.filter(w => !currentIds.includes(w.id));
    if (newWidgets.length > 0) {
      setLayouts((prev) => [...prev, ...makeDefaultLayouts(newWidgets)]);
    }
  }, [widgets, makeDefaultLayouts]);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayouts(newLayout);
    localStorage.setItem(layoutStorageKey, JSON.stringify(newLayout));
  }, [layoutStorageKey]);

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
    const defaultLayouts = makeDefaultLayouts(widgets);
    setLayouts(defaultLayouts);
    setRemovedWidgets([]);
    localStorage.removeItem(layoutStorageKey);
    localStorage.removeItem(`${storageKey}-removed`);
    localStorage.removeItem(`${storageKey}-layouts`);
  }, [widgets, storageKey, layoutStorageKey, makeDefaultLayouts]);

  const hiddenWidgets = widgets.filter(w => removedWidgets.includes(w.id));

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
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

      {/* Grid */}
      <Responsive
        className="dashboard-grid"
        layouts={{ lg: visibleLayouts }}
        cols={COLS}
        rowHeight={isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP}
        width={containerWidth || 1280}
        dragConfig={{ enabled: isEditing, handle: ".drag-handle" }}
        resizeConfig={{ enabled: isEditing }}
        onLayoutChange={handleLayoutChange}
        compactor={verticalCompactor}
        margin={isMobile ? ([10, 10] as const) : ([12, 12] as const)}
        containerPadding={[0, 0] as const}
      >
        {visibleWidgets.map(widget => (
          <div key={widget.id} className="relative group/widget h-full min-h-0">
            {isEditing && (
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
              className={`h-full w-full min-h-0 flex flex-col overflow-hidden ${
                widget.contentOverflow === "visible" ? "!overflow-visible" : ""
              } ${isEditing ? "ring-1 ring-dashed ring-border rounded-xl" : ""}`}
            >
              {widget.component}
            </div>
          </div>
        ))}
      </Responsive>
    </div>
  );
};

export default DashboardGrid;
