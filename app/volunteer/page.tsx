import type { Metadata } from "next";
import {
  Bike,
  Camera,
  Coins,
  Home,
  Megaphone,
  MonitorSmartphone,
  Soup,
  Siren,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { VolunteerForm } from "@/components/volunteer/VolunteerForm";
import { getHelpContent } from "@/services/content";

import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Join the KGP PAWS pack — feeding rounds, rescue response, fostering, photography, tech and more. Every skill has a place.",
  alternates: { canonical: "/volunteer" },
};

const ICON_MAP: Record<string, LucideIcon> = {
  soup: Soup,
  siren: Siren,
  bike: Bike,
  camera: Camera,
  megaphone: Megaphone,
  "monitor-smartphone": MonitorSmartphone,
  coins: Coins,
  home: Home,
};

export default async function VolunteerPage() {
  const content = await getHelpContent();
  const intro = content.find(c => c.section === "intro");
  const rolesContent = content.find(c => c.section === "volunteer_opportunities");

  const roles = (rolesContent?.data?.opportunities as Array<{ icon: string, role: string, description: string }>) ?? [];

  return (
    <div className="pb-24">
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-16 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <p className="eyebrow mb-5 text-marigold">Join the pack</p>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            {intro?.title || "Every skill has a place in the pack."}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/70">
            {intro?.body}
          </p>
        </div>
      </header>

      <div className="container-page mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        {/* roles */}
        <section aria-labelledby="roles-h">
          <h2 id="roles-h" className="sr-only">
            Volunteer roles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((r, i) => {
              const Icon = ICON_MAP[r.icon] ?? Soup;
              return (
                <Reveal key={r.role} delay={Math.min(i * 0.06, 0.3)} className="h-full">
                  <div className="group flex h-full gap-4 rounded-3xl border border-line bg-ivory p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-forest-deep">
                        {r.role}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-moss">{r.description}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.2}>
            <blockquote className="mt-8 rounded-3xl bg-forest p-7 text-cream">
              <p className="font-display text-xl italic leading-relaxed">
                “People ask if getting up at 4:30 is hard. It is. Then a dog
                you&apos;ve fed for three years sees you and her whole body
                wags, and you&apos;d genuinely do it twice a day.”
              </p>
              <footer className="mt-3 text-sm text-sand">
                — from the volunteer diary
              </footer>
            </blockquote>
          </Reveal>
        </section>

        {/* registration */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <VolunteerForm />
        </aside>
      </div>
    </div>
  );
}
