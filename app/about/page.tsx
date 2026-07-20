import type { Metadata } from "next";
import {
  HeartPulse,
  QrCode,
  Scissors,
  ShieldCheck,
  Soup,
  Syringe,
  Home,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading, DemoNotice } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { PawMark, Seal } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who KGP PAWS is, why the animals of IIT Kharagpur need support, and how a digital identity for every paw changes what campus animal welfare can be.",
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    icon: Soup,
    title: "Feeding",
    text: "Daily feeding rounds keep campus animals healthy, predictable in their territories, and easy to monitor for early signs of illness.",
  },
  {
    icon: HeartPulse,
    title: "Treatment",
    text: "From paw injuries to accident response — volunteers coordinate first aid, vet visits, and recovery care for every reported animal.",
  },
  {
    icon: Syringe,
    title: "Vaccination",
    text: "Annual anti-rabies drives protect both animals and people, making the campus safer for everyone who shares it.",
  },
  {
    icon: Scissors,
    title: "Sterilization",
    text: "Humane population management through sterilize-and-release — fewer puppies born into hardship, healthier community animals.",
  },
  {
    icon: Home,
    title: "Adoption",
    text: "Careful matching of campus dogs and cats with families — applications, meet-and-greets, and post-adoption follow-ups.",
  },
  {
    icon: Users,
    title: "Student volunteers",
    text: "Students, scholars, staff and faculty run everything: feeding routes, rescue response, adoption coordination, and this platform itself.",
  },
];

/**
 * Timeline entries are CMS-editable placeholders — no invented
 * institutional dates or claims are presented as verified fact.
 */
const TIMELINE = [
  {
    period: "The beginning",
    title: "A feeding circle forms",
    text: "A handful of students start pooling mess leftovers and pocket money to feed the dogs of their hostel area. (Editable placeholder — add your verified founding story.)",
  },
  {
    period: "Growing up",
    title: "Organized rescue response",
    text: "Feeding circles connect into a society: shared duty rosters, a vet network, and the first vaccination drives. (Editable placeholder.)",
  },
  {
    period: "Scaling care",
    title: "Sterilization & records",
    text: "Systematic sterilize-and-release begins, and volunteers start keeping proper health records per animal. (Editable placeholder.)",
  },
  {
    period: "Today",
    title: "A digital identity for every paw",
    text: "QR collar tags link each animal to a living health record — making care continuous even as volunteer batches graduate.",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* hero */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-16 pt-32 text-cream md:-mt-20 md:pt-40">
        <div className="container-page flex items-center gap-12">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4 text-sand">About KGP PAWS</p>
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">
              Care that outlasts every batch.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-cream/85">
              KGP PAWS is the Animal Welfare Society of IIT Kharagpur — a
              volunteer-run community of students, scholars, staff and faculty
              who look after the animals that call this campus home. Students
              graduate every year. The animals stay. Our job is to make sure
              the care stays too.
            </p>
          </div>
          <Seal
            variant="light"
            size={256}
            alt="Official seal of the Kharagpur Pradyogiki Animal Welfare Society"
            className="ml-auto hidden h-56 w-56 shrink-0 opacity-90 lg:block xl:h-64 xl:w-64"
          />
        </div>
      </header>

      {/* why */}
      <section className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2" aria-labelledby="why-h">
        <Reveal>
          <SectionHeading
            eyebrow="Why it matters"
            title="Campus animals live between systems."
            sub=""
          />
          <div className="mt-5 space-y-4 text-base leading-relaxed text-charcoal/85">
            <p>
              A campus dog isn&apos;t a pet, and isn&apos;t quite a street
              dog either. She has a territory, a routine, and hundreds of
              humans who know her by name — but no single person responsible
              for her when she&apos;s hit by a bike at midnight or stops
              eating for three days.
            </p>
            <p>
              That gap is where KGP PAWS works. Organized feeding so nutrition
              isn&apos;t luck. A rescue pipeline so an injury reported at
              11 PM gets a response, not a shrug. Vaccination and
              sterilization so kindness scales beyond individual animals to
              the whole population.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="grain flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-sand to-terracotta p-10 text-center text-parchment">
            <PawMark className="h-14 w-14" />
            <p className="max-w-xs font-display text-2xl font-bold leading-snug">
              “No paw on this campus should be anonymous in an emergency.”
            </p>
            <p className="text-xs uppercase tracking-[0.2em]">The PAWS principle</p>
          </div>
        </Reveal>
      </section>

      {/* pillars */}
      <section className="bg-parchment py-16 sm:py-20" aria-labelledby="pillars-h">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="What we do"
              title="Six kinds of care."
              align="center"
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={Math.min(i * 0.07, 0.35)} className="h-full">
                <div className="flex h-full flex-col gap-3 rounded-3xl border border-line bg-cream p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream">
                    <p.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-display text-xl font-bold text-forest-deep">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-moss">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* timeline */}
      <section className="container-page py-16 sm:py-20" aria-labelledby="timeline-h">
        <Reveal>
          <SectionHeading
            eyebrow="Our journey"
            title="From feeding circle to digital identity."
          />
        </Reveal>
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.1} className="h-full">
              <li className="relative flex h-full flex-col gap-2 rounded-3xl border border-line bg-parchment p-6">
                <span className="eyebrow text-[10px] text-terracotta-deep">
                  {t.period}
                </span>
                <h3 className="font-display text-lg font-bold text-forest-deep">
                  {t.title}
                </h3>
                <p className="text-sm leading-relaxed text-moss">{t.text}</p>
                <span
                  className="absolute -top-2 left-6 grid h-6 w-6 place-items-center rounded-full bg-terracotta text-[10px] font-black text-parchment"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
              </li>
            </Reveal>
          ))}
        </ol>
        <DemoNotice className="mt-6">
          Timeline entries are CMS-editable placeholders — verified milestones
          are added by society admins, never invented here.
        </DemoNotice>
      </section>

      {/* digital identity vision */}
      <section className="bg-forest-deep py-16 text-cream sm:py-20" aria-labelledby="vision-h">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[auto_1fr]">
          <Reveal>
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-cream/10">
              <QrCode className="h-12 w-12 text-sand" aria-hidden="true" />
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="vision-h" className="font-display text-3xl font-bold sm:text-4xl">
              The digital identity vision
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-cream/85">
              Volunteer knowledge used to graduate with the volunteers — which
              dog is vaccinated, who&apos;s recovering from what, who gets
              nervous around bikes. PAWS digital identity moves that knowledge
              out of heads and into a record that persists: scan a collar tag,
              and four years of care history is in your hand.
            </p>
            <div className="mt-6">
              <ButtonLink href="/animal/simba" variant="light" size="lg">
                See a live digital ID
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* policies */}
      <section className="container-page grid gap-8 py-16 sm:py-20 lg:grid-cols-2">
        <article
          id="privacy"
          aria-labelledby="privacy-h"
          className="scroll-mt-28 rounded-3xl border border-line bg-parchment p-7 sm:p-9"
        >
          <h2
            id="privacy-h"
            className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
          >
            <ShieldCheck className="h-6 w-6 text-forest-bright" aria-hidden="true" />
            Privacy policy
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-charcoal/85">
            <li>
              <strong>Reporters:</strong> contact details on rescue reports are
              optional, visible only to the responding team, and never
              published.
            </li>
            <li>
              <strong>Donors:</strong> donation records are private. Public
              campaign pages show aggregate totals and supporter counts only.
            </li>
            <li>
              <strong>Volunteers:</strong> personal phone numbers and
              addresses are never exposed on public pages.
            </li>
            <li>
              <strong>QR scans:</strong> we log only the scan time and coarse
              device category — never your identity, and location only with
              your explicit permission.
            </li>
            <li>
              <strong>Accounts:</strong> authentication is handled by our
              identity provider; we store the minimum profile needed for your
              role.
            </li>
          </ul>
        </article>

        <article
          id="animal-data"
          aria-labelledby="animal-data-h"
          className="scroll-mt-28 rounded-3xl border border-line bg-parchment p-7 sm:p-9"
        >
          <h2
            id="animal-data-h"
            className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
          >
            <PawMark className="h-6 w-6 text-terracotta" />
            Animal data policy
          </h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-charcoal/85">
            <li>
              <strong>Zone-level location only:</strong> public profiles show
              approximate campus zones. Precise coordinates live inside
              access-controlled rescue records.
            </li>
            <li>
              <strong>No live tracking:</strong> we never publish real-time
              movement of community animals.
            </li>
            <li>
              <strong>Vulnerable animals:</strong> admins can hide any animal
              from public listings during medical care, relocation, or when
              there is risk of harm.
            </li>
            <li>
              <strong>Respectful imagery:</strong> graphic injury photos are
              restricted to internal case records — public stories use
              recovery-focused imagery.
            </li>
            <li>
              <strong>Honest records:</strong> health statuses are updated by
              authorized volunteers and admins with audit trails; impact
              numbers are configuration, clearly labelled when demo.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
