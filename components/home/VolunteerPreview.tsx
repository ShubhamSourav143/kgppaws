import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { VolunteerRole } from "@/lib/volunteer/roles";

/**
 * Homepage preview of volunteer roles. Driven by the same VOLUNTEER_ROLE_CARDS
 * the /volunteer page renders, so a new role appears here automatically.
 */
export function VolunteerPreview({ roles }: { roles: VolunteerRole[] }) {
  const items = roles.slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="volunteer-h"
      className="overflow-hidden bg-mist py-24 sm:py-32"
    >
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-5 text-saffron-deep">Join the pack</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Every skill has a place here."
            className="text-balance font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-5xl"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal/75">
              KGP PAWS runs entirely on volunteers. Whether you can help with an
              injured dog, design a poster, code a feature or share our work
              online — there is a role for you.
            </p>
          </Reveal>
        </div>

        <Stagger
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          gap={0.08}
        >
          {items.map((role) => (
            <Item key={role.title} effect="rise" className="h-full">
              <div className="group flex h-full flex-col rounded-3xl border border-line bg-ivory p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember transition-transform group-hover:scale-110">
                  <role.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-forest-deep">
                  {role.title}
                </h3>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-moss">
                  {role.description}
                </p>
              </div>
            </Item>
          ))}
        </Stagger>

        <Reveal delay={0.2}>
          <div className="mt-10">
            <Link
              href="/volunteer"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              See all roles and sign up
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
