"use client";

import { useEffect, useRef, useState } from "react";

export function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const x = "touches" in e ? e.touches[0]!.clientX : (e as MouseEvent).clientX;
      updateFromClientX(x);
    };
    const onUp = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  // TODO: Replace with a hosted asset on R2 once you have a real before/after.
  const imgUrl =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=2400&q=85";

  return (
    <div className="relative">
      <div className="absolute -top-3 left-0 right-0 flex justify-between text-[10px] uppercase tracking-[0.3em] text-bone-dim font-mono">
        <span>← arraste</span>
        <span>antes / depois</span>
      </div>

      <div
        ref={containerRef}
        onMouseDown={(e) => {
          draggingRef.current = true;
          updateFromClientX(e.clientX);
        }}
        onTouchStart={(e) => {
          draggingRef.current = true;
          updateFromClientX(e.touches[0]!.clientX);
        }}
        className="relative w-full aspect-[16/9] overflow-hidden cursor-ew-resize select-none border border-ink-line"
      >
        {/* AFTER (sharp) — bottom layer */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl}
          alt="Após processamento"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* BEFORE (degraded) — clipped layer */}
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgUrl}
            alt="Antes do processamento"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "blur(6px) saturate(0.65) brightness(0.85) contrast(0.85)", transform: "scale(1.03)" }}
            draggable={false}
          />
          <div
            className="absolute inset-0 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(#0c0a08 1px, transparent 1px), linear-gradient(90deg, #0c0a08 1px, transparent 1px)",
              backgroundSize: "8px 8px",
            }}
          />
        </div>

        <div className="absolute top-4 left-4 px-3 py-1 bg-ink/80 backdrop-blur-sm text-[10px] uppercase tracking-[0.25em] text-bone-dim font-mono">
          720p · original
        </div>
        <div className="absolute top-4 right-4 px-3 py-1 bg-copper text-ink text-[10px] uppercase tracking-[0.25em] font-medium font-mono">
          8K · ultra
        </div>

        <div className="absolute top-0 bottom-0 w-px bg-bone pointer-events-none" style={{ left: `${pos}%` }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-bone shadow-2xl flex items-center justify-center">
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-ink" />
              <span className="w-1 h-3 bg-ink" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-bone-dim font-mono">
        <div>
          <span className="text-copper">↗</span> 1280×720 → 10240×5760
        </div>
        <div>
          <span className="text-copper">⏱</span> processado em 14.2s
        </div>
        <div>
          <span className="text-copper">◷</span> +9.700% pixels
        </div>
        <div>
          <span className="text-copper">▣</span> 300 dpi · pronta p/ impressão
        </div>
      </div>
    </div>
  );
}
