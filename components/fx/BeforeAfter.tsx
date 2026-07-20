"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Draggable before/after comparison. Pointer + touch + keyboard
 * (the handle is a slider input for a11y).
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel = "Rescue day",
  afterLabel = "Today",
  alt,
  className,
}: {
  before: string;
  after: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100)));
  }, []);

  return (
    <div
      ref={ref}
      className={cn("group relative select-none overflow-hidden rounded-[2rem] shadow-lift", className)}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && update(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      {/* after (base) */}
      <Image src={after} alt={`${alt} — ${afterLabel}`} fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
      {/* before (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt={`${alt} — ${beforeLabel}`} fill sizes="(min-width: 1024px) 40rem, 100vw" className="object-cover" />
      </div>

      {/* divider + handle */}
      <div className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-ivory/90 shadow-[0_0_12px_rgba(0,0,0,0.35)]" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ivory text-forest shadow-lift transition-transform group-active:scale-95">
          <MoveHorizontal className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>

      <span className="absolute left-4 top-4 rounded-full bg-night/65 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ivory backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="absolute right-4 top-4 rounded-full bg-saffron/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ivory backdrop-blur-sm">
        {afterLabel}
      </span>

      <input
        type="range"
        min={4}
        max={96}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare ${beforeLabel} and ${afterLabel} for ${alt}`}
        className="absolute inset-x-4 bottom-3 h-6 w-auto cursor-ew-resize opacity-0 focus-visible:opacity-100"
      />
    </div>
  );
}
