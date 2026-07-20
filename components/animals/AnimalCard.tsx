"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Mars, Venus, MapPin } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { HealthChip, AdoptionChip } from "@/components/animals/chips";
import { SaveButton } from "@/components/animals/SaveButton";
import { Tilt } from "@/components/fx/Tilt";
import { zoneName } from "@/lib/demo/zones";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types";

const SEX_META: Record<Animal["sex"], { icon: typeof Mars; label: string } | null> = {
  male: { icon: Mars, label: "Male" },
  female: { icon: Venus, label: "Female" },
  unknown: null,
};

export function AnimalCard({
  animal,
  tilt = false,
  className,
}: {
  animal: Animal;
  tilt?: boolean;
  className?: string;
}) {
  const sex = SEX_META[animal.sex];
  const canAdopt = animal.adoption === "available" || animal.adoption === "foster_needed";

  const card = (
    <Link
      href={`/animal/${animal.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow",
        className
      )}
    >
      <div className="relative overflow-hidden">
        <div className="transition-transform duration-700 ease-out group-hover:scale-[1.06]">
          <AnimalPortrait
            animal={animal}
            photoUrl={animal.photos.find((p) => p.url)?.url}
            className="aspect-[5/4] rounded-none"
          />
        </div>
        {/* hover veil + peek */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-night/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        />
        <SaveButton
          slug={animal.slug}
          name={animal.name}
          className="absolute right-3 top-3"
        />
        <div className="absolute bottom-3 left-3">
          <AdoptionChip status={animal.adoption} />
        </div>
        <span
          className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-ivory text-forest opacity-0 shadow-soft transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden="true"
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
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
        <p className="text-xs font-bold uppercase tracking-wider text-moss">
          {animal.species === "dog" ? "Indie Dog" : animal.species === "cat" ? "Indie Cat" : "Campus Animal"}
          {" · "}
          {animal.color}
        </p>
        <p className="font-display text-[15px] italic leading-snug text-charcoal/65">
          &ldquo;{animal.tagline}&rdquo;
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <HealthChip status={animal.healthStatus} />
          {animal.vaccinated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-forest">
              <BadgeCheck className="h-3 w-3" aria-hidden="true" />
              Vaccinated
            </span>
          )}
          {sex && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chakra/12 px-2.5 py-1 text-[11px] font-bold text-chakra-ink">
              <sex.icon className="h-3 w-3" aria-hidden="true" />
              {sex.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-forest">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {zoneName(animal.zoneId)}
          </span>
          <span className="rounded-full bg-sand-light px-2.5 py-1 text-[11px] font-bold text-earth">
            {animal.ageLabel}
          </span>
        </div>

        {/* explicit, always-visible adopt affordance */}
        <div
          className={cn(
            "-mx-5 -mb-5 mt-3 flex items-center justify-between border-t border-line px-5 py-3.5 text-sm font-bold transition-colors",
            canAdopt
              ? "text-saffron-deep group-hover:bg-saffron/8"
              : "text-moss group-hover:bg-mist"
          )}
        >
          {canAdopt
            ? animal.adoption === "available"
              ? "Adopt me"
              : "Foster me"
            : "View profile"}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );

  return tilt ? <Tilt className="relative h-full">{card}</Tilt> : card;
}
