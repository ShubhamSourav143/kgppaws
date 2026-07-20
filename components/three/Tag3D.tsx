"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { QrTagFlip } from "@/components/qr/QrTagFlip";

const TagScene = dynamic(() => import("./TagScene"), { ssr: false, loading: () => null });

/**
 * Progressive 3D: mounts the R3F tag only on capable, motion-friendly
 * devices; everyone else gets the accessible CSS flip tag.
 */
export function Tag3D({
  name,
  pawsId,
  qrToken,
  className,
}: {
  name: string;
  pawsId: string;
  qrToken: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    // probe off the render path — the rAF callback is an external-system event
    const id = requestAnimationFrame(() => {
      try {
        const canvas = document.createElement("canvas");
        setWebgl(!!(canvas.getContext("webgl2") || canvas.getContext("webgl")));
      } catch {
        setWebgl(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (reduced || webgl === false) {
    return (
      <div className={className}>
        <QrTagFlip name={name} pawsId={pawsId} qrToken={qrToken} className="mx-auto max-w-[16rem]" />
      </div>
    );
  }
  if (webgl === null) return <div className={className} aria-hidden="true" />;

  return (
    <div className={className}>
      <TagScene name={name} qrToken={qrToken} />
    </div>
  );
}
