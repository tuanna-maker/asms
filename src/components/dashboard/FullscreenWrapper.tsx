import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FullscreenWrapperProps {
  children: ReactNode;
  className?: string;
}

const FullscreenWrapper = ({ children, className = "" }: FullscreenWrapperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`group relative ${isFullscreen ? "bg-background p-6 overflow-auto flex flex-col" : ""} ${className}`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
      <div className={isFullscreen ? "flex-1 w-full" : ""}>
        {children}
      </div>
    </div>
  );
};

export default FullscreenWrapper;
