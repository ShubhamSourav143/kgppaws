import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "eyebrow mb-3",
            tone === "dark" ? "text-terracotta-deep" : "text-sand"
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "text-balance font-display text-3xl font-bold leading-[1.08] sm:text-4xl lg:text-5xl",
          tone === "dark" ? "text-forest-deep" : "text-cream"
        )}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-moss" : "text-cream/80"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export function DemoNotice({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs italic text-moss/80", className)}>
      {children ?? "Demo data shown for illustration — managed via the admin dashboard in production."}
    </p>
  );
}
