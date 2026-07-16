"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { HealthChip, AdoptionChip } from "@/components/animals/chips";
import { SaveButton } from "@/components/animals/SaveButton";
import { TiltCard } from "@/components/motion/TiltCard";
import { zoneName } from "@/lib/demo/zones";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types";

export function AnimalCard({
  animal,
  tilt = false,
  className,
}: {
  animal: Animal;
  tilt?: boolean;
  className?: string;
}) {
  const card = (
    <Link
      href={`/animal/${animal.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-parchment shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        className
      )}
    >
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.04]">
          <AnimalPortrait animal={animal} className="aspect-[5/4] rounded-none" />
        </div>
        <SaveButton
          slug={animal.slug}
          name={animal.name}
          className="absolute right-3 top-3"
        />
        <div className="absolute bottom-3 left-3">
          <AdoptionChip status={animal.adoption} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl font-bold text-forest-deep">
            {animal.name}
          </h3>
          <span className="shrink-0 font-mono text-[10px] font-semibold tracking-wide text-moss">
            {animal.pawsId}
          </span>
        </div>
        <p className="text-sm italic leading-snug text-moss">
          “{animal.tagline}”
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <HealthChip status={animal.healthStatus} />
          <span className="inline-flex items-center gap-1 rounded-full border border-forest/15 px-2.5 py-1 text-[11px] font-bold text-moss">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {zoneName(animal.zoneId)}
          </span>
          <span className="rounded-full border border-forest/15 px-2.5 py-1 text-[11px] font-bold text-moss">
            {animal.ageLabel}
          </span>
        </div>
      </div>
    </Link>
  );

  return tilt ? <TiltCard className="h-full">{card}</TiltCard> : card;
}
