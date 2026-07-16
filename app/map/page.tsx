import type { Metadata } from "next";
import { ShieldCheck, Users } from "lucide-react";
import { listAnimals } from "@/services/animals";
import { CampusMap } from "@/components/map/CampusMap";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Campus Paws Map",
  description:
    "An interactive map of the animals of IIT Kharagpur — by campus zone, with health and adoption status. Privacy-first: no precise locations are shown publicly.",
  alternates: { canonical: "/map" },
};

export default async function MapPage() {
  const animals = await listAnimals();

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3 text-terracotta-deep">Campus Paws Map</p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] text-forest-deep sm:text-5xl lg:text-6xl">
          Who lives where.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-moss">
          Tap a paw marker to meet the residents of each campus zone. Filters
          narrow things down when you&apos;re looking for someone specific.
        </p>
      </header>

      <div className="mt-10">
        <CampusMap animals={animals} />
      </div>

      {/* privacy + volunteer access */}
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <section
          aria-labelledby="map-privacy-h"
          className="rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-8"
        >
          <h2
            id="map-privacy-h"
            className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
          >
            <ShieldCheck className="h-6 w-6 text-forest-bright" aria-hidden="true" />
            Privacy by design
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-charcoal/85">
            <li>
              Public visitors see <strong>approximate campus zones</strong> —
              never live positions or movement patterns.
            </li>
            <li>
              Precise rescue coordinates exist only inside active rescue
              reports, visible to the assigned volunteers and admins.
            </li>
            <li>
              Animals marked <em>cautious</em> or in vulnerable situations can
              be hidden from the public map entirely by admins.
            </li>
          </ul>
        </section>

        <section
          aria-labelledby="map-volunteer-h"
          className="rounded-3xl bg-forest p-6 text-cream shadow-soft sm:p-8"
        >
          <h2
            id="map-volunteer-h"
            className="flex items-center gap-2 font-display text-2xl font-bold"
          >
            <Users className="h-6 w-6 text-sand" aria-hidden="true" />
            Volunteer view
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-cream/85">
            Authorized volunteers get an operational layer: open rescue
            reports with exact locations, feeding-route stops, and animals
            due for follow-up care. Access is role-based and audited.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/volunteer" variant="light">
              Become a volunteer
            </ButtonLink>
            <ButtonLink href="/login" variant="accent">
              Volunteer sign in
            </ButtonLink>
          </div>
        </section>
      </div>
    </div>
  );
}
