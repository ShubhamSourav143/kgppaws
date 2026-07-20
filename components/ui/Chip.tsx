import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type ChipTone =
  | "forest"
  | "terracotta"
  | "sand"
  | "mist"
  | "clay"
  | "outline"
  | "chakra";

const TONES: Record<ChipTone, string> = {
  forest: "bg-forest text-cream",
  terracotta: "bg-terracotta text-parchment",
  sand: "bg-sand-light text-forest-deep",
  mist: "bg-mist text-forest",
  clay: "bg-clay text-terracotta-deep",
  outline: "border border-forest/20 text-moss",
  chakra: "bg-chakra/12 text-chakra-ink",
};

export function Chip({
  tone = "mist",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
