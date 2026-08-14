import Link from "next/link";
import {
  PawPrint,
  ClipboardList,
  PhoneCall,
  Heart,
  ArrowRight,
} from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { ShareButton } from "@/components/adopt/ShareButton";
import { RescueStoryCard, type RescueStory } from "@/components/adopt/RescueStoryCard";
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
  /**
   * Laika's card linked to the literal "/animal/laika". That slug only exists
   * in lib/demo/animals.ts, so the link worked in demo mode and 404'd on any
   * real database: services/animals.ts getAnimal() deliberately returns
   * undefined rather than falling back to demo data once Supabase is
   * configured, and app/animal/[slug]/page.tsx then calls notFound(). Resolve
   * it against the animals actually passed in, and fall back to the adopt
   * listing on this same page when she is not among them.
   */
  const stories: RescueStory[] = [
    {
      name: "Romi",
      tag: "Labrador · rescued from neglect",
      body: "Years of neglect left Romi thin, frightened and alone. Rescued and treated by our volunteers, she's slowly learning that a raised hand can also mean a gentle one.",
      fullStory: [
        "When Romi first came to us she flinched at every sudden movement. Years of being ignored and shooed away had taught her that people meant trouble, and she had the thin frame and dull coat to show for it.",
        "Our volunteers took it slowly — food left at a distance, then a little closer, then a hand held out palm-up until she chose to come. Alongside the patience came the practical care: deworming, a course of treatment for her skin, regular meals and the steady routine a frightened dog needs to feel safe.",
        "She is a different dog now — brighter, heavier, and learning every day that not every raised hand is a threat. Romi is still waiting for the family who will give her the calm, gentle home she has earned.",
      ],
      subjects: [{ subject: ROMI, photo: covers.romi }],
    },
    {
      name: "Odin",
      tag: "Breed dog · rescued from exploitation",
      body: "Bred for profit and discarded once he was no longer useful, Odin came to us anxious and unwell. Today he's healthy, safe and still waiting for the family he was always owed.",
      fullStory: [
        "Odin spent the first part of his life as a means to an end — bred for profit, kept only as long as he was useful, and abandoned the moment he was not. He arrived anxious, underweight and wary of everyone.",
        "Rehabilitation for a dog like Odin is as much about trust as it is about medicine. Once he was healthy again, the work was patient and quiet: showing him that food comes reliably, that a lead means a walk and not a drag, and that human hands can be kind.",
        "He has come through it a calm, affectionate companion who asks for very little. Odin is still waiting for the family he was always owed — one that will keep him for who he is, not for what he can give.",
      ],
      subjects: [{ subject: ODIN, photo: covers.odin }],
    },
    {
      name: "Laika",
      tag: "Puppy · rescued after rains",
      body: "The sole survivor of a litter found behind Nalanda during the March rains. Bottle-fed by volunteers, she is now a confident, curious puppy ready for a family.",
      fullStory: [
        "Laika was found behind Nalanda during the March rains — the only survivor of her litter, cold and barely bigger than a hand. For the first weeks she depended entirely on round-the-clock bottle feeds from a rota of volunteers.",
        "She grew fast. The puppy who once needed warming against a water bottle is now first to every game, endlessly curious and completely convinced that every person she meets is a friend.",
        "Vaccinated, dewormed and thriving, Laika is ready for a home of her own.",
      ],
      subjects: [
        { subject: subjectFor(animals, "laika", ROMI), photo: covers.laika },
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

        <Stagger className="mt-12 grid items-start gap-6 md:grid-cols-3">
          {stories.map((s) => (
            <Item key={s.name}>
              <RescueStoryCard story={s} />
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
    body: "Meet the dogs waiting on campus — each with a full health record and personality.",
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

/** Adoption steps rendered as one continuous timeline — numbered discs sitting
 *  on a single rail so they read as an obvious 1 → 2 → 3 → 4 flow rather than
 *  a grid of parallel cards. The rail runs left-to-right across the four steps
 *  on desktop and turns vertical once they stack on narrow screens. */
export function AdoptionProcess() {
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

        <Stagger className="relative mx-auto mt-14 max-w-3xl lg:max-w-none">
          {/* The rail the numbered discs sit on. One element that flips
              orientation: vertical down the left of the stacked steps, and
              horizontal across their centres once they sit in a row. The
              columns are gapless and exactly a quarter each, so the first and
              last disc centres land on 12.5% / 87.5% — the rail spans between
              them and never juts past the end numbers. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-8 left-[22px] top-8 w-px bg-gradient-to-b from-saffron/50 via-saffron/30 to-saffron/50 sm:left-[28px] lg:bottom-auto lg:left-[12.5%] lg:right-[12.5%] lg:top-7 lg:h-px lg:w-auto lg:bg-gradient-to-r"
          />

          <div className="space-y-10 sm:space-y-14 lg:grid lg:grid-cols-4 lg:gap-0 lg:space-y-0">
            {STEPS.map((step, i) => (
              <Item key={step.title}>
                <div className="relative flex gap-5 sm:gap-7 lg:flex-col lg:items-center lg:gap-0 lg:px-5 lg:text-center">
                  <span className="relative z-10 mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron font-display text-lg font-bold text-ivory shadow-ember sm:h-[3.5rem] sm:w-[3.5rem] sm:text-xl lg:mt-0">
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1 sm:pt-2 lg:pt-6">
                    <div className="flex items-center gap-2.5 lg:justify-center">
                      <h3 className="font-display text-xl font-bold text-forest-deep sm:text-2xl lg:text-xl">
                        {step.title}
                      </h3>
                      <step.icon
                        className="h-4 w-4 shrink-0 text-forest-bright sm:h-[1.125rem] sm:w-[1.125rem]"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-charcoal/70 sm:mt-2.5 sm:text-base lg:mt-3 lg:text-sm">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Item>
            ))}
          </div>
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
    { subject: bySlug("simba") ?? ROMI, slug: "simba" },
    { subject: bySlug("shanti") ?? ODIN, slug: "shanti" },
    { subject: ROMI, slug: "romi" },
    { subject: ODIN, slug: "odin" },
    { subject: bySlug("laika") ?? ROMI, slug: "laika" },
    { subject: bySlug("rocket") ?? ODIN, slug: "rocket" },
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

        <Stagger className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
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
