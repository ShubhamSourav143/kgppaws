import Link from "next/link";
import { cn } from "@/lib/utils";

export function PawMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn("h-9 w-9", className)}
      fill="currentColor"
    >
      {/* toes */}
      <ellipse cx="14" cy="15" rx="5" ry="6.5" transform="rotate(-18 14 15)" />
      <ellipse cx="34" cy="15" rx="5" ry="6.5" transform="rotate(18 34 15)" />
      <ellipse cx="6.5" cy="26" rx="4.2" ry="5.5" transform="rotate(-32 6.5 26)" />
      <ellipse cx="41.5" cy="26" rx="4.2" ry="5.5" transform="rotate(32 41.5 26)" />
      {/* pad */}
      <path d="M24 22c6.5 0 12 5.2 12 11.2 0 4.6-3.4 7.3-7.2 6.4-2-.5-3.4-.8-4.8-.8s-2.8.3-4.8.8c-3.8.9-7.2-1.8-7.2-6.4C12 27.2 17.5 22 24 22Z" />
    </svg>
  );
}

export function Logo({
  variant = "dark",
  compact = false,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5",
        variant === "dark" ? "text-forest" : "text-cream"
      )}
      aria-label="KGP PAWS — home"
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6",
          variant === "dark" ? "bg-forest text-cream" : "bg-cream text-forest"
        )}
      >
        <PawMark className="h-6 w-6" />
      </span>
      <span className="leading-none">
        <span className="block font-display text-xl font-bold tracking-tight">
          KGP PAWS
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.18em] sm:block",
              variant === "dark" ? "text-moss" : "text-sand"
            )}
          >
            Animal Welfare · IIT Kharagpur
          </span>
        )}
      </span>
    </Link>
  );
}
