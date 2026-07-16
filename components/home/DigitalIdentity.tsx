import { Reveal } from "@/components/motion/Reveal";
import { QrTagFlip } from "@/components/qr/QrTagFlip";
import { ButtonLink } from "@/components/ui/Button";
import { BadgeCheck, HeartPulse, MapPin, Syringe } from "lucide-react";
import type { Animal } from "@/types";

/** “Not Just a Collar. A Digital Identity.” */
export function DigitalIdentity({ animal }: { animal: Animal }) {
  const points = [
    { icon: BadgeCheck, text: "Verified identity — name, PAWS ID, and campus zone" },
    { icon: Syringe, text: "Vaccination and sterilization status at a glance" },
    { icon: HeartPulse, text: "Health history and treatment timeline" },
    { icon: MapPin, text: "How and where to help, if they ever need it" },
  ];

  return (
    <section className="bg-forest-deep py-20 text-cream sm:py-28" aria-labelledby="identity-h">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <Reveal className="mx-auto w-full max-w-[260px]">
          <QrTagFlip
            name={animal.name}
            pawsId={animal.pawsId}
            qrToken={animal.qrToken}
          />
          <p className="mt-6 text-center text-xs text-cream/60">
            Hover or tap the tag — the QR is real. Scan it with your phone.
          </p>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow mb-4 text-sand">Paws Digital Identity</p>
            <h2
              id="identity-h"
              className="text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl"
            >
              Not Just a Collar. A&nbsp;Digital Identity.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream/85">
              When someone scans a PAWS tag, they can instantly learn who the
              animal is, understand their health history, and know how to
              help.
            </p>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {points.map((p, i) => (
              <Reveal key={p.text} delay={0.08 * i}>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cream/10">
                    <p.icon className="h-4 w-4 text-sand" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-sm leading-relaxed text-cream/90">
                    {p.text}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
          <Reveal delay={0.3}>
            <div className="mt-9">
              <ButtonLink href={`/animal/${animal.slug}`} variant="light" size="lg">
                Explore Digital Animal ID
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
