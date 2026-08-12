"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, HeartHandshake, Users } from "lucide-react";
import { CampaignGallery, type GalleryPhoto } from "@/components/donate/CampaignGallery";
import { ShareButton } from "@/components/adopt/ShareButton";
import { Counter } from "@/components/fx/Counter";
import { Magnetic } from "@/components/fx/Magnetic";
import { formatINR, cn } from "@/lib/utils";
import type { CampaignEditorial } from "@/lib/donate/editorial";
import type { DonationCampaign } from "@/types";

/**
 * One programme, told at full width: the story and its money on one side, a
 * cinematic reel of the work on the other, with the impact tiers underneath
 * so a visitor can see exactly what their amount buys before they pick one.
 *
 * All figures come from the campaign row — this component computes nothing
 * about money beyond the percentage it draws.
 */
export function CampaignFeature({
  campaign,
  editorial,
  photos,
  index,
}: {
  campaign: DonationCampaign;
  editorial: CampaignEditorial;
  photos: GalleryPhoto[];
  index: number;
}) {
  const reduced = useReducedMotion() ?? false;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  const pct = campaign.goal
    ? Math.min(100, Math.round((campaign.raised / campaign.goal) * 100))
    : 0;
  // alternate which side the reel sits on, so the page reads as a rhythm
  const flip = index % 2 === 1;

  return (
    <section
      ref={ref}
      aria-labelledby={`cmp-${campaign.slug}`}
      className="scroll-mt-24"
      id={campaign.slug}
    >
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-14",
          flip && "lg:[&>*:first-child]:order-2"
        )}
      >
        {/* ——— story + money ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="min-w-0"
        >
          <p className="eyebrow mb-4 text-saffron-deep">{editorial.eyebrow}</p>
          <h3
            id={`cmp-${campaign.slug}`}
            className="text-balance font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-[2.75rem]"
          >
            {campaign.title}
          </h3>
          <p className="mt-5 text-lg leading-relaxed text-charcoal/75">
            {editorial.lede}
          </p>

          <ul className="mt-6 space-y-3">
            {editorial.points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest-bright/12 text-forest-bright">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed text-charcoal/70 sm:text-[0.95rem]">
                  {point}
                </span>
              </li>
            ))}
          </ul>

          {/* fact strip */}
          {editorial.figures && (
            <dl className="mt-7 grid grid-cols-3 gap-3 rounded-2xl border border-line bg-parchment p-4">
              {editorial.figures.map((f) => (
                <div key={f.label} className="min-w-0">
                  <dt className="truncate text-[11px] font-bold uppercase tracking-wider text-moss">
                    {f.label}
                  </dt>
                  <dd className="mt-1 font-display text-base font-bold text-forest-deep sm:text-lg">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {/* ——— progress ——— */}
          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                {/* Counter runs its own in-view trigger */}
                <p className="font-display text-3xl font-bold text-forest-deep sm:text-4xl">
                  <Counter value={campaign.raised} prefix="₹" />
                </p>
                <p className="mt-1 text-sm text-moss">
                  raised of {formatINR(campaign.goal)} goal
                </p>
              </div>
              <p className="shrink-0 font-display text-2xl font-bold text-saffron-deep sm:text-3xl">
                {pct}
                <span className="text-lg">%</span>
              </p>
            </div>

            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-sand"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${campaign.title} funding progress`}
            >
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold"
                initial={reduced ? false : { width: 0 }}
                animate={inView ? { width: `${pct}%` } : undefined}
                transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={reduced ? { width: `${pct}%` } : undefined}
              />
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-sm text-moss">
              <Users className="h-4 w-4" aria-hidden="true" />
              {campaign.supporters} supporters so far
            </p>
          </div>

          {/* ——— actions ——— */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.2}>
              <a
                href="#give"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = "give";
                }}
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-7 py-3.5 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
              >
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
                Donate Now
                <ArrowUpRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </a>
            </Magnetic>
            <ShareButton
              title={`${campaign.title} — KGP PAWS`}
              text={editorial.lede}
              className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-6 py-3.5 text-sm font-bold text-forest transition-colors hover:bg-mist"
            />
          </div>
        </motion.div>

        {/* ——— gallery ——— */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="min-w-0"
        >
          <CampaignGallery photos={photos} title={campaign.title} />
        </motion.div>
      </div>

      {/* ——— impact tiers ——— */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10"
      >
        <p className="text-xs font-bold uppercase tracking-wider text-moss">
          What your gift does here
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {editorial.tiers.map((tier) => (
            <div
              key={tier.amount}
              className="group rounded-2xl border border-line bg-ivory p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-saffron/40 hover:shadow-glow"
            >
              <p className="font-display text-2xl font-bold text-saffron-deep">
                {formatINR(tier.amount)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal/70">
                {tier.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
