import Link from "next/link";
import { ArrowUpRight, Heart, HandHeart } from "lucide-react";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

/**
 * The homepage's closing invitation. Kept deliberately different from the
 * footer's own CTA band (which leads on "meet the paws" + "donate") — this one
 * frames the two ways an individual can show up: give a home, or give time.
 */
export function FinalCta() {
  return (
    <section
      aria-labelledby="final-h"
      className="relative overflow-hidden bg-cream py-24 text-center sm:py-32"
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,184,76,0.20),transparent_65%)]"
      />
      <div className="container-page relative">
        <Reveal effect="fade">
          <p className="eyebrow mb-5 text-saffron-deep">Be part of it</p>
        </Reveal>
        <TextReveal
          as="h2"
          text="Give a home, or give a few hours."
          className="mx-auto max-w-3xl text-balance font-display text-3xl font-bold leading-[1.1] text-forest-deep sm:text-4xl lg:text-5xl"
        />
        <Reveal delay={0.15}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-charcoal/75">
            You can give a campus animal a home, or give a few hours to the
            ones who stay. Both change a life — and it starts today.
          </p>
        </Reveal>
        <Reveal delay={0.25}>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/adopt"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              Adopt a friend
            </Link>
            <Link
              href="/volunteer"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-forest px-8 py-4 text-base font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              <HandHeart className="h-5 w-5" aria-hidden="true" />
              Volunteer with us
              <ArrowUpRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
