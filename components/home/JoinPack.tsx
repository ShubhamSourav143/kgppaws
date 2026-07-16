"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import {
  HandHeart,
  Home,
  Heart,
  IndianRupee,
  PenLine,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { PawMark } from "@/components/brand/Logo";

const WAYS = [
  { icon: HandHeart, label: "Volunteer", text: "Join the feeding & rescue crew", href: "/volunteer" },
  { icon: Home, label: "Foster", text: "A soft landing while they heal", href: "/adopt?filter=foster" },
  { icon: Heart, label: "Adopt", text: "Give a paw a forever address", href: "/adopt" },
  { icon: IndianRupee, label: "Donate", text: "Fund food, meds & rescues", href: "/donate" },
  { icon: PenLine, label: "Share a Story", text: "Tell us about a campus paw", href: "/stories#share" },
];

interface Paw {
  id: number;
  x: number;
  y: number;
  rot: number;
}

/**
 * Join the Pack — the one (and only) playful paw-cursor-trail section.
 * Trail is desktop-mouse only and disabled for reduced motion.
 */
export function JoinPack() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [paws, setPaws] = useState<Paw[]>([]);
  const lastSpawn = useRef(0);
  const nextId = useRef(0);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (reduce) return;
      const now = performance.now();
      if (now - lastSpawn.current < 130) return;
      lastSpawn.current = now;
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const paw: Paw = {
        id: nextId.current++,
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        rot: Math.random() * 60 - 30,
      };
      setPaws((p) => [...p.slice(-11), paw]);
      window.setTimeout(
        () => setPaws((p) => p.filter((q) => q.id !== paw.id)),
        1100
      );
    },
    [reduce]
  );

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative overflow-hidden bg-mist py-20 sm:py-24"
      aria-labelledby="join-h"
    >
      {/* paw trail */}
      {paws.map((p) => (
        <span
          key={p.id}
          aria-hidden="true"
          className="pointer-events-none absolute text-forest/25"
          style={{
            left: p.x,
            top: p.y,
            transform: `translate(-50%, -50%) rotate(${p.rot}deg)`,
            animation: "pulse-soft 1.1s ease-out forwards",
          }}
        >
          <PawMark className="h-5 w-5" />
        </span>
      ))}

      <div className="container-page relative">
        <Reveal>
          <SectionHeading
            eyebrow="Join the Pack"
            title="There are five ways in."
            align="center"
          />
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {WAYS.map((w, i) => (
            <Reveal key={w.label} delay={i * 0.07} className="h-full">
              <Link
                href={w.href}
                className="group flex h-full flex-col items-center gap-3 rounded-3xl border border-line bg-parchment p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-forest/30 hover:shadow-lift"
              >
                <span className="grid h-13 w-13 place-items-center rounded-2xl bg-forest p-3.5 text-cream transition-transform duration-300 group-hover:-rotate-6">
                  <w.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-display text-lg font-bold text-forest-deep">
                  {w.label}
                </span>
                <span className="text-xs leading-relaxed text-moss">{w.text}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
