"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useReveal } from "./use-reveal";

/**
 * Editorial word-by-word reveal for display headlines.
 *
 * Rendered as normal text in SSR. The per-word slide-up is CSS gated on
 * html[data-reveal-ready] (see globals.css `.textreveal`), so if JavaScript
 * never runs the headline is simply visible rather than blank — the
 * framer-motion version server-rendered each word translated 110% off its clip,
 * which left every display headline invisible on a failed/slow bundle.
 *
 * The stagger is a per-word `--i` custom property consumed by the CSS
 * transition-delay, so it works for any word count without JS.
 */
export function TextReveal({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  once = true,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  const ref = useReveal<HTMLHeadingElement>({ once, amount: 0.6 });
  const words = text.split(" ");

  return (
    <Tag
      ref={ref}
      className={cn("textreveal", className)}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span key={i} className="textreveal__line" aria-hidden="true">
          <span className="textreveal__word" style={{ "--i": i } as CSSProperties}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}
