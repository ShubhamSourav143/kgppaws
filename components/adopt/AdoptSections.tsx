import Link from "next/link";
import {
  PawPrint,
  ClipboardList,
  PhoneCall,
  Heart,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { ShareButton } from "@/components/adopt/ShareButton";
import type { Animal, PortraitConfig } from "@/types";

type Subject = Pick<Animal, "name" | "species" | "portrait">;

/** slug → real photo src map (empty until photos are dropped into
 *  public/images/adopt/). Every image slot falls back to the illustrated
 *  portrait system when a photo is missing, so nothing ever looks broken. */
export type Covers = Record<string, string>;

/* Synthetic portraits for two rescues that don't have live profiles yet —
   used only as a fallback until real photos (romi.jpg / odin.jpg) exist. */
const ROMI: Subject = {
  name: "Romi",
  species: "dog",
  portrait: {
    from: "#F3E2BE",
    to: "#C79A54",
    coat: "#E4BC7A",
    coatDark: "#B98F4E",
    muzzle: "#F8EFDC",
    ear: "floppy",
    tongue: true,
  } as PortraitConfig,
};

const ODIN: Subject = {
  name: "Odin",
  species: "dog",
  portrait: {
    from: "#D9C4A8",
    to: "#5E4A36",
    coat: "#7A5B3C",
    coatDark: "#43301F",
    muzzle: "#E7D8C2",
    ear: "pointed",
    patch: "left-eye",
    patchColor: "#3A2C1E",
    tongue: false,
  } as PortraitConfig,
};

/* Section 2 · "Why Adoption Matters" is now the storytelling carousel in
   components/adopt/WhyAdoptCarousel.tsx (client component). */

/* ————————————————————————— 3 · Every rescue has a story ————————————————————————— */

function subjectFor(animals: Animal[], slug: string, fallback: Subject): Subject {
  return animals.find((a) => a.slug === slug) ?? fallback;
}

export function RescueStories({
  animals,
  covers = {},
}: {
  animals: Animal[];
  covers?: Covers;
}) {
  const stories: {
    name: string;
    tag: string;
    body: string;
    href: string;
    subjects: { subject: Subject; photo?: string }[];
  }[] = [
    {
      name: "Romi",
      tag: "Labrador · rescued from neglect",
      body: "Years of neglect left Romi thin, frightened and alone. Rescued and treated by our volunteers, she's slowly learning that a raised hand can also mean a gentle one.",
      href: "/stories",
      subjects: [{ subject: ROMI, photo: covers.romi }],
    },
    {
      name: "Odin",
      tag: "Breed dog · rescued from exploitation",
      body: "Bred for profit and discarded once he was no longer useful, Odin came to us anxious and unwell. Today he's healthy, safe and still waiting for the family he was always owed.",
      href: "/stories",
      subjects: [{ subject: ODIN, photo: covers.odin }],
    },
    {
      name: "Muesli & Bunti",
      tag: "Street puppies · lifelong care",
      body: "Attacked by larger dogs as puppies, both survived — but their injuries left lasting damage and a lifelong need for patient, committed care.",
      href: "/animal/bunti",
      subjects: [
        { subject: subjectFor(animals, "muesli", ROMI), photo: covers.muesli },
        { subject: subjectFor(animals, "bunti", ODIN), photo: covers.bunti },
      ],
    },
  ];

  return (
    <section className="bg-parchment py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-4 text-saffron-deep">Real rescues</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="Every Rescue Has a Story"
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          />
        </div>

        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <Item key={s.name}>
              <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-ivory shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow">
                <div className="relative flex aspect-[5/4] gap-0.5 overflow-hidden bg-mist">
                  {s.subjects.map((x, i) => (
                    <AnimalPortrait
                      key={i}
                      animal={x.subject}
                      photoUrl={x.photo}
                      className="h-full flex-1 rounded-none transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                    />
                  ))}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-night/45 to-transparent" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-2xl font-bold text-forest-deep">
                    {s.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-wider text-moss">
                    {s.tag}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                    {s.body}
                  </p>
                  <Link
                    href={s.href}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-saffron-deep transition-colors hover:text-saffron"
                  >
                    Read more
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ————————————————————————— 4 · Adoption process ————————————————————————— */

const STEPS = [
  {
    icon: PawPrint,
    title: "Browse our animals",
    body: "Meet the dogs and cats waiting on campus — each with a full health record and personality.",
  },
  {
    icon: Heart,
    title: "Click “Adopt Me”",
    body: "Found a paw that pulled at you? Open their profile and start the adoption.",
  },
  {
    icon: ClipboardList,
    title: "Fill the adoption form",
    body: "A short form tells us about your home and how you'll care for them.",
  },
  {
    icon: PhoneCall,
    title: "We'll reach out",
    body: "A PAWS volunteer contacts you to guide the meet-and-greet and every next step.",
  },
];

/** Optional per-step photos (step-1.jpg … step-4.jpg). Falls back to the
 *  numbered icon badge until a photo exists. */
export function AdoptionProcess({ covers = {} }: { covers?: Covers }) {
  const stepPhoto = (i: number) => covers[`step-${i + 1}`];

  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="container-page">
        <div className="max-w-2xl">
          <Reveal effect="fade">
            <p className="eyebrow mb-4 text-saffron-deep">How it works</p>
          </Reveal>
          <TextReveal
            as="h2"
            text="The Adoption Process"
            className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
          />
        </div>

        <Stagger className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const photo = stepPhoto(i);
            return (
              <Item key={step.title}>
                <div className="flex h-full flex-col gap-4 rounded-3xl border border-line bg-ivory p-6 shadow-soft">
                  {photo ? (
                    <div className="relative -m-6 mb-0 aspect-[16/10] overflow-hidden rounded-t-3xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={step.title}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember font-display text-base font-bold">
                        {i + 1}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember font-display text-lg font-bold">
                        {i + 1}
                      </span>
                      <step.icon className="h-5 w-5 text-forest-bright" aria-hidden="true" />
                    </div>
                  )}
                  <h3 className="font-display text-lg font-bold text-forest-deep">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-charcoal/70">
                    {step.body}
                  </p>
                </div>
              </Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ————————————————————————— 6 · Final call to action ————————————————————————— */

export function FinalCta({
  animals,
  covers = {},
}: {
  animals: Animal[];
  covers?: Covers;
}) {
  const bySlug = (slug: string) => animals.find((a) => a.slug === slug);
  const tiles: { subject: Subject; slug: string }[] = [
    { subject: bySlug("bunti") ?? ODIN, slug: "bunti" },
    { subject: bySlug("muesli") ?? ROMI, slug: "muesli" },
    { subject: ROMI, slug: "romi" },
    { subject: ODIN, slug: "odin" },
    { subject: bySlug("simba") ?? ROMI, slug: "simba" },
    { subject: bySlug("laika") ?? ODIN, slug: "laika" },
    { subject: bySlug("percy") ?? ROMI, slug: "percy" },
    { subject: bySlug("mishti") ?? ODIN, slug: "mishti" },
  ];

  return (
    <section className="aurora relative overflow-hidden bg-night py-20 text-ivory sm:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <TextReveal
            as="h2"
            text="They Deserve a Family. Will You Be The One?"
            className="text-balance font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          />
          <Reveal delay={0.15}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">
              Even if you can&apos;t adopt today, you can still help. Share their
              stories with your friends and family — one share could help an
              animal find a forever home.
            </p>
          </Reveal>
        </div>

        <Stagger className="mx-auto mt-12 grid max-w-4xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
          {tiles.map((t, i) => (
            <Item key={i}>
              <figure className="overflow-hidden rounded-2xl bg-ivory/5 ring-1 ring-ivory/10">
                <AnimalPortrait
                  animal={t.subject}
                  photoUrl={covers[t.slug]}
                  className="aspect-square w-full rounded-none"
                />
                <figcaption className="px-2 py-2 text-center text-xs font-bold text-ivory/70">
                  {t.subject.name}
                </figcaption>
              </figure>
            </Item>
          ))}
        </Stagger>

        <Reveal delay={0.1} className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#animals"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-8 py-4 text-base font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
          >
            Adopt an Animal
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <ShareButton />
        </Reveal>
      </div>
    </section>
  );
}
