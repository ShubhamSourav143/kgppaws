import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Infinite horizontal marquee (pure CSS; pauses for reduced motion). */
export function Marquee({
  children,
  duration = 40,
  reverse = false,
  className,
}: {
  children: ReactNode;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className="anim-marquee flex w-max items-center gap-10 pr-10"
        style={{
          ["--marquee-duration" as string]: `${duration}s`,
          animationDirection: reverse ? "reverse" : undefined,
        }}
      >
        {children}
        <span aria-hidden="true" className="flex items-center gap-10">
          {children}
        </span>
      </div>
    </div>
  );
}
