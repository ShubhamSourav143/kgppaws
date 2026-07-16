"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PawMark } from "@/components/brand/Logo";
import { QrCodeImage } from "@/components/qr/QrCode";
import { SITE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The PAWS collar tag, rendered as a 3D flip card.
 * Front: KGP PAWS mark + animal name. Back: real scannable QR + PAWS ID.
 * Hover flips on desktop; tap toggles on touch. Keyboard accessible.
 */
export function QrTagFlip({
  name,
  pawsId,
  qrToken,
  className,
  idleSwing = true,
}: {
  name: string;
  pawsId: string;
  qrToken: string;
  className?: string;
  idleSwing?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const url = `${SITE.url}/p/${qrToken}`;

  return (
    <div className={cn("perspective-1000", className)}>
      <div className={idleSwing && !reduce ? "anim-swing" : undefined}>
        {/* strap */}
        <div className="mx-auto mb-[-10px] h-8 w-3 rounded-full bg-terracotta shadow-soft" />
        <motion.button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          onHoverStart={() => setFlipped(true)}
          onHoverEnd={() => setFlipped(false)}
          aria-label={
            flipped
              ? `Showing QR code for ${name}. Activate to show the front of the tag.`
              : `Showing front of ${name}'s collar tag. Activate to reveal the QR code.`
          }
          className="preserve-3d relative block aspect-[3/4] w-full"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 120, damping: 16 }
          }
        >
          {/* front */}
          <div className="backface-hidden absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-4 border-sand bg-forest p-6 text-cream shadow-lift">
            <div className="absolute left-1/2 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-sand bg-forest-deep" />
            <PawMark className="h-12 w-12 text-sand" />
            <p className="font-display text-3xl font-bold">{name}</p>
            <p className="eyebrow text-[10px] text-sand">KGP PAWS</p>
            <p className="absolute bottom-4 text-[10px] text-cream/60">
              flip me
            </p>
          </div>

          {/* back */}
          <div
            className="backface-hidden absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] border-4 border-sand bg-parchment p-6 shadow-lift"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="absolute left-1/2 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-sand bg-cream" />
            <QrCodeImage value={url} size={200} className="w-[70%]" />
            <p className="font-mono text-xs font-bold tracking-wide text-forest">
              {pawsId}
            </p>
            <p className="text-center text-[10px] leading-tight text-moss">
              Scan to open my digital identity
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
