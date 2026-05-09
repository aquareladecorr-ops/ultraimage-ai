"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ResultComparatorProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function ResultComparator({
  beforeUrl,
  afterUrl,
  beforeLabel = "Original",
  afterLabel = "Ultra Engine",
}: ResultComparatorProps) {
  const [pos, setPos] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const panningRef = useRef(false);

  const clampPan = useCallback(
    (x: number, y: number, z: number) => {
      if (!containerRef.current) return { x, y };
      const rect = containerRef.current.getBoundingClientRect();
      const maxX = (rect.width * (z - 1)) / 2;
      const maxY = (rect.height * (z - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    []
  );

  const updateSliderFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const x =
        "touches" in e ? e.touches[0]!.clientX : (e as MouseEvent).clientX;
      const y =
        "touches" in e ? e.touches[0]!.clientY : (e as MouseEvent).clientY;

      if (draggingRef.current) {
        updateSliderFromClientX(x);
        return;
      }

      if (panningRef.current && zoom > 1) {
        const dx = x - panStart.x;
        const dy = y - panStart.y;
        const clamped = clampPan(panStart.panX + dx, panStart.panY + dy, zoom);
        setPan(clamped);
      }
    };

    const onUp = () => {
      draggingRef.current = false;
      panningRef.current = false;
      setIsDraggingSlider(false);
      setIsPanning(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [zoom, panStart, clampPan]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(5, prev + delta));
      if (next === 1) setPan({ x: 0, y: 0 });
      else setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  };

  const zoomIn = () =>
    setZoom((prev) => {
      const next = Math.min(5, prev + 0.5);
      setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });

  const zoomOut = () =>
    setZoom((prev) => {
      const next = Math.max(1, prev - 0.5);
      if (next === 1) setPan({ x: 0, y: 0 });
      else setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDownContainer = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-slider-handle]")) return;
    if (zoom > 1) {
      panningRef.current = true;
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
    }
  };

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="relative select-none">
      <div className="absolute -top-6 left-0 right-0 flex justify-between text-[10px] uppercase tracking-[0.3em] text-bone-dim font-mono pointer-events-none">
        <span>{zoom > 1 ? "arraste para mover" : "arraste para comparar"}</span>
        <span>antes / depois</span>
      </div>

      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownContainer}
        className="relative w-full overflow-hidden border border-ink-line bg-ink-deep"
        style={{
          aspectRatio: "16/9",
          cursor: isDraggingSlider
            ? "ew-resize"
            : zoom > 1
            ? isPanning
              ? "grabbing"
              : "grab"
            : "ew-resize",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: "translate(" + pan.x + "px, " + pan.y + "px) scale(" + zoom + ")",
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterUrl}
            alt="Depois do processamento"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: "inset(0 " + (100 - pos) + "% 0 0)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={beforeUrl}
              alt="Antes do processamento"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>

        <div
          data-slider-handle
          className="absolute top-0 bottom-0 z-20"
          style={{ left: pos + "%" }}
          onMouseDown={(e) => {
            e.stopPropagation();
            draggingRef.current = true;
            setIsDraggingSlider(true);
            updateSliderFromClientX(e.clientX);
          }}
          onTouchStart={(e) => {
            draggingRef.current = true;
            setIsDraggingSlider(true);
            updateSliderFromClientX(e.touches[0]!.clientX);
          }}
        >
          <div className="absolute top-0 bottom-0 w-px bg-bone" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-bone shadow-2xl flex items-center justify-center cursor-ew-resize"
          >
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-ink rounded-full" />
              <span className="w-1 h-3 bg-ink rounded-full" />
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 px-3 py-1 bg-ink/80 backdrop-blur-sm text-[10px] uppercase tracking-[0.25em] text-bone-dim font-mono pointer-events-none z-10">
          {beforeLabel}
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-copper text-ink text-[10px] uppercase tracking-[0.25em] font-medium font-mono pointer-events-none z-10">
          {afterLabel}
        </div>

        <div className="absolute bottom-4 left-4 px-2 py-1 bg-ink/70 backdrop-blur-sm text-[10px] font-mono text-bone-dim z-10 pointer-events-none">
          {zoomPct}%
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={zoomOut}
          disabled={zoom <= 1}
          className="p-2 border border-ink-line hover:border-copper transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom out"
        >
          <ZoomOut size={14} className="text-bone-dim" />
        </button>
        <button
          onClick={zoomIn}
          disabled={zoom >= 5}
          className="p-2 border border-ink-line hover:border-copper transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Zoom in"
        >
          <ZoomIn size={14} className="text-bone-dim" />
        </button>
        <button
          onClick={resetZoom}
          disabled={zoom === 1}
          className="p-2 border border-ink-line hover:border-copper transition disabled:opacity-30 disabled:cursor-not-allowed"
          title="Resetar zoom"
        >
          <Maximize2 size={14} className="text-bone-dim" />
        </button>
        <span className="text-xs text-bone-dim font-mono ml-2">
          scroll para zoom &middot; arraste a barra para comparar
        </span>
      </div>
    </div>
  );
}
