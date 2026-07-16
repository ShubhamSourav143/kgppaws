"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowRight, ShieldCheck } from "lucide-react";
import { PawMark } from "@/components/brand/Logo";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { HealthChip, AdoptionChip } from "@/components/animals/chips";
import { CAMPUS_ZONES, zoneName } from "@/lib/demo/zones";
import { formatDate, cn } from "@/lib/utils";
import type { Animal } from "@/types";

type MapFilter = "all" | "dogs" | "cats" | "attention" | "adoptable" | "community";

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All Paws" },
  { id: "dogs", label: "Dogs" },
  { id: "cats", label: "Cats" },
  { id: "attention", label: "Needs Attention" },
  { id: "adoptable", label: "Adoptable" },
  { id: "community", label: "Community Animals" },
];

function matches(animal: Animal, f: MapFilter) {
  switch (f) {
    case "dogs":
      return animal.species === "dog";
    case "cats":
      return animal.species === "cat";
    case "attention":
      return animal.healthStatus === "under_treatment" || animal.healthStatus === "recovering";
    case "adoptable":
      return animal.adoption === "available" || animal.adoption === "foster_needed";
    case "community":
      return animal.adoption === "not_available";
    default:
      return true;
  }
}

/**
 * Stylized campus map. Shows generalized zones only — precise animal
 * coordinates are never public (operational data is role-restricted).
 * Swap in Mapbox tiles via NEXT_PUBLIC_MAPBOX_TOKEN (see README) without
 * changing this component's privacy model.
 */
export function CampusMap({
  animals,
  compact = false,
  className,
}: {
  animals: Animal[];
  compact?: boolean;
  className?: string;
}) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const filtered = useMemo(
    () => animals.filter((a) => matches(a, filter)),
    [animals, filter]
  );

  const byZone = useMemo(() => {
    const m = new Map<string, Animal[]>();
    for (const a of filtered) {
      m.set(a.zoneId, [...(m.get(a.zoneId) ?? []), a]);
    }
    return m;
  }, [filtered]);

  const activeAnimals = activeZone ? (byZone.get(activeZone) ?? []) : [];

  return (
    <div className={className}>
      {!compact && (
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Filter animals on the map"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setActiveZone(null);
              }}
              aria-pressed={filter === f.id}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold transition-colors",
                filter === f.id
                  ? "bg-forest text-cream"
                  : "border border-forest/20 text-forest hover:bg-mist"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-line bg-mist shadow-soft">
        {/* map art */}
        <svg viewBox="0 0 100 70" className="block w-full" aria-hidden="true">
          <defs>
            <linearGradient id="map-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EAF0E8" />
              <stop offset="100%" stopColor="#E0E9DD" />
            </linearGradient>
          </defs>
          <rect width="100" height="70" fill="url(#map-bg)" />
          {/* green patches */}
          <ellipse cx="18" cy="34" rx="14" ry="9" fill="#2E6B56" opacity="0.12" />
          <ellipse cx="84" cy="12" rx="16" ry="9" fill="#2E6B56" opacity="0.10" />
          <ellipse cx="52" cy="62" rx="22" ry="10" fill="#2E6B56" opacity="0.10" />
          <ellipse cx="70" cy="40" rx="10" ry="6" fill="#2E6B56" opacity="0.12" />
          {/* water body (Hijli-side pond) */}
          <ellipse cx="12" cy="62" rx="9" ry="5" fill="#5B8A8A" opacity="0.25" />
          {/* roads */}
          <g stroke="#D9CCA9" strokeLinecap="round" fill="none">
            <path d="M4 18 H96" strokeWidth="2.6" />
            <path d="M24 4 V66" strokeWidth="2.2" />
            <path d="M52 18 V66" strokeWidth="2.2" />
            <path d="M76 18 V58" strokeWidth="2" />
            <path d="M24 42 H96" strokeWidth="2" />
            <path d="M4 56 Q30 52 52 56" strokeWidth="1.6" />
          </g>
          {/* zone labels */}
          {CAMPUS_ZONES.map((z) => (
            <text
              key={z.id}
              x={z.x}
              y={z.y + 6.4}
              textAnchor="middle"
              fontSize="2.5"
              fontWeight="700"
              fill="#5B6A5D"
              style={{ fontFamily: "var(--font-manrope)" }}
            >
              {z.name}
            </text>
          ))}
        </svg>

        {/* paw markers (HTML overlay for accessibility) */}
        {CAMPUS_ZONES.map((z) => {
          const zoneAnimals = byZone.get(z.id) ?? [];
          if (zoneAnimals.length === 0) return null;
          const active = activeZone === z.id;
          return (
            <button
              key={z.id}
              type="button"
              onClick={() => setActiveZone(active ? null : z.id)}
              aria-expanded={active}
              aria-label={`${z.name}: ${zoneAnimals.length} ${zoneAnimals.length === 1 ? "animal" : "animals"}`}
              className={cn(
                "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-soft transition-all duration-200",
                compact ? "h-7 w-7 sm:h-9 sm:w-9" : "h-9 w-9 sm:h-11 sm:w-11",
                active
                  ? "z-20 scale-110 bg-terracotta text-parchment"
                  : "z-10 bg-forest text-cream hover:scale-110 hover:bg-forest-bright"
              )}
              style={{ left: `${z.x}%`, top: `${(z.y / 70) * 100}%` }}
            >
              <PawMark className={compact ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5"} />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-sand text-[9px] font-black text-forest-deep">
                {zoneAnimals.length}
              </span>
            </button>
          );
        })}

        {/* mini profile panel */}
        <AnimatePresence>
          {activeZone && activeAnimals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-x-3 bottom-3 z-30 rounded-2xl border border-line bg-parchment/95 p-3 shadow-lift backdrop-blur-sm sm:inset-x-auto sm:right-4 sm:w-80"
              role="region"
              aria-label={`Animals in ${zoneName(activeZone)}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold text-forest-deep">
                  {zoneName(activeZone)}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveZone(null)}
                  aria-label="Close panel"
                  className="grid h-8 w-8 place-items-center rounded-full text-moss hover:bg-mist"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {activeAnimals.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/animal/${a.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-cream p-2 transition-colors hover:border-forest/30"
                    >
                      <AnimalPortrait animal={a} className="h-14 w-14 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-base font-bold text-forest-deep">
                          {a.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <HealthChip status={a.healthStatus} />
                          <AdoptionChip status={a.adoption} />
                        </div>
                        <p className="mt-1 truncate text-[11px] text-moss">
                          Updated {formatDate(a.lastHealthUpdate)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-moss transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-moss">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        For every animal&apos;s safety, the public map shows approximate campus
        zones only. Precise locations are available to authorized volunteers
        during active rescues.
      </p>
    </div>
  );
}
