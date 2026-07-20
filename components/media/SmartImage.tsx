"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/**
 * next/image with a shimmer skeleton while loading, a soft fade-in,
 * and a branded fallback if the source 404s. Use for every content photo.
 */
export function SmartImage({
  className,
  imgClassName,
  alt,
  ...props
}: Omit<ImageProps, "className"> & {
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          "grid place-items-center bg-sand-light text-moss",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-50" fill="currentColor" aria-hidden="true">
          <ellipse cx="14" cy="15" rx="5" ry="6.5" transform="rotate(-18 14 15)" />
          <ellipse cx="34" cy="15" rx="5" ry="6.5" transform="rotate(18 34 15)" />
          <ellipse cx="6.5" cy="26" rx="4.2" ry="5.5" transform="rotate(-32 6.5 26)" />
          <ellipse cx="41.5" cy="26" rx="4.2" ry="5.5" transform="rotate(32 41.5 26)" />
          <path d="M24 22c6.5 0 12 5.2 12 11.2 0 4.6-3.4 7.3-7.2 6.4-2-.5-3.4-.8-4.8-.8s-2.8.3-4.8.8c-3.8.9-7.2-1.8-7.2-6.4C12 27.2 17.5 22 24 22Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", !loaded && "skeleton", className)}>
      <Image
        {...props}
        alt={alt}
        className={cn(
          "transition-[opacity,transform] duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0 scale-[1.02]",
          imgClassName
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
