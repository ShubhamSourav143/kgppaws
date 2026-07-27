"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

/**
 * Real, scannable QR code rendered client-side.
 * Encodes the public /p/{token} resolver URL — never a database UUID.
 */
export function QrCodeImage({
  value,
  className,
  size = 240,
  dark = "#173F35",
  light = "#FCF8F0",
  onDataUrl,
}: {
  value: string;
  className?: string;
  size?: number;
  dark?: string;
  light?: string;
  /** Called with the generated PNG data URL each time it re-renders. Lets
   *  a parent (e.g. the Donate modal) attach a Download button that saves
   *  the same PNG the user is looking at. */
  onDataUrl?: (dataUrl: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setSrc(url);
          onDataUrl?.(url);
        }
      })
      .catch(() => {
        /* decorative fallback below */
      });
    return () => {
      cancelled = true;
    };
  }, [value, size, dark, light, onDataUrl]);

  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={cn("animate-pulse rounded-lg bg-sand-light", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- data URL generated client-side
    <img
      src={src}
      alt={`QR code linking to ${value}`}
      width={size}
      height={size}
      className={cn("rounded-lg", className)}
    />
  );
}
