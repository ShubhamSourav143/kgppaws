import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronDown,
  HeartPulse,
  Home,
  Scissors,
  ShieldCheck,
  Soup,
  Syringe,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { PawMark, Seal } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "About KGP PAWS",
  description:
    "KGP PAWS is a student-led animal welfare society at IIT Kharagpur. We feed, treat, vaccinate, sterilize, rescue and rehome the campus animals.",
  alternates: { canonical: "/about" },
};

const PILLARS = [
  {
    icon: Soup,
    title: "Feeding",
    text: "Daily feeding rounds so campus dogs and cats do not go hungry — especially during vacations when the messes shut and their usual food disappears.",
  },
  {
    icon: HeartPulse,
    title: "Treatment",
    text: "First aid, vet visits and follow-up care for injuries, accidents, skin conditions and other health issues reported by students and volunteers.",
  },
  {
    icon: Syringe,
    title: "Vaccination",
    text: "Regular anti-rabies and DHPP drives to protect the animals and everyone who shares the campus with them.",
  },
  {
    icon: Scissors,
    title: "Sterilization",
    text: "Humane sterilize-and-release camps to slowly stabilise the campus population and reduce the number of animals born into hardship.",
  },
  {
    icon: Home,
    title: "Adoption",
    text: "Careful matching of campus animals with caring families through personal reviews, meet-and-greets and follow-ups.",
  },
  {
    icon: Users,
    title: "Student volunteers",
    text: "Everything above is run by student volunteers, research scholars, staff, faculty and their families — no paid staff, no external management.",
  },
];

/**
 * Practical FAQ entries. Deliberately short and honest — students, staff
 * and campus visitors should be able to skim these and understand what to
 * do without needing to email or DM.
 */
const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is KGP PAWS?",
    answer:
      "KGP PAWS is short for Kharagpur Pradyogiki Animal Welfare Society. We are a student-led society at IIT Kharagpur that looks after the dogs, cats and other animals living on the campus.",
  },
  {
    question: "Who can volunteer?",
    answer:
      "Any student, research scholar, faculty member, staff member or family member on campus can volunteer. We have roles that fit different skills — from feeding rounds and rescue work to poster design, video editing and website development. Sign up on the Volunteer page.",
  },
  {
    question: "How can I adopt a campus animal?",
    answer:
      "Open the Adopt page, pick an animal whose profile feels right for you, and fill the short adoption form. A volunteer from our team will review the request personally and get back to you to plan the next steps.",
  },
  {
    question: "How are donations used?",
    answer:
      "Every rupee we receive goes to the animals — feeding supplies, vaccines, sterilization camps, medical treatment during emergencies and rescue operations. No money is spent on salaries. Volunteers work for free.",
  },
  {
    question: "Who takes care of injured animals?",
    answer:
      "Our volunteer rescue team responds to reports. When an animal is found injured or unwell, volunteers give first aid, take the animal to a partner vet if needed, and keep the animal in care until it recovers.",
  },
  {
    question: "Can I report a sick or injured dog?",
    answer:
      "Yes — please do. Tap the floating Report button anywhere on the site, upload a photo, share the location and describe what you see. A volunteer will attend to it as soon as possible.",
  },
  {
    question: "Are campus dogs vaccinated?",
    answer:
      "We run anti-rabies drives every year and cover as many campus dogs as we safely can. Vaccinated dogs are recorded in our register. When you meet a KGP PAWS collar-tag dog, scan the tag to see its health record.",
  },
  {
    question: "How can I support KGP PAWS?",
    answer:
      "The three easiest ways are: donate through the Donate page, volunteer through the Volunteer page, and report any animal that needs help through the Report button. Sharing our posts and stories with your friends also helps a lot.",
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
              A student-led society for the animals of IIT Kharagpur.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-cream/85">
              KGP PAWS — the Kharagpur Pradyogiki Animal Welfare Society — is
              run entirely by students, scholars, staff and faculty who share
              the campus with hundreds of dogs, cats and other animals. Our
              work is simple: feed them, treat them, protect them, and give
              those who need a home a chance at one.
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
      <section
        className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2"
        aria-labelledby="why-h"
      >
        <Reveal>
          <SectionHeading
            eyebrow="Why we exist"
            title="Students and campus animals share this place."
            sub=""
          />
          <div className="mt-5 space-y-4 text-base leading-relaxed text-charcoal/85">
            <p>
              Dogs and cats have lived on the IIT Kharagpur campus for as long
              as anyone can remember. Students grow attached to them. Staff
              families feed them. Faculty children play with them. But nobody
              is officially responsible for what happens when one of them is
              hit by a scooter at midnight, or stops eating for three days,
              or gives birth to puppies during the monsoon.
            </p>
            <p>
              That gap is where KGP PAWS works. We organise the feeding so
              that nutrition is not left to luck. We respond to rescue reports
              so that injured animals are not left to suffer. We vaccinate and
              sterilize so that kindness reaches the entire population and not
              only the few animals a batch of students happen to know.
            </p>
            <p>
              Compassion, vaccination, sterilization, rescue and adoption
              together make the campus safer and healthier — for the animals
              and for the people who share it with them.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="grain flex h-full min-h-64 flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-br from-sand to-terracotta p-10 text-center text-parchment">
            <PawMark className="h-14 w-14" />
            <p className="max-w-xs font-display text-2xl font-bold leading-snug">
              &ldquo;No paw on this campus should be anonymous in an
              emergency.&rdquo;
            </p>
            <p className="text-xs uppercase tracking-[0.2em]">
              The PAWS principle
            </p>
          </div>
        </Reveal>
      </section>

      {/* pillars */}
      <section
        className="bg-parchment py-16 sm:py-20"
        aria-labelledby="pillars-h"
      >
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="What we do"
              title="Six kinds of care, every day."
              align="center"
            />
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <Reveal
                key={p.title}
                delay={Math.min(i * 0.07, 0.35)}
                className="h-full"
              >
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

      {/* how to help */}
      <section
        className="container-page grid gap-6 py-16 sm:grid-cols-3 sm:py-20"
        aria-label="How to help"
      >
        <Reveal>
          <Link
            href="/volunteer"
            className="group flex h-full flex-col gap-2 rounded-3xl border border-line bg-parchment p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-saffron-deep">
              Volunteer
            </p>
            <p className="font-display text-xl font-bold text-forest-deep">
              Join the team →
            </p>
            <p className="text-sm leading-relaxed text-moss">
              From feeding rounds to poster design, there is a role that fits
              your skills.
            </p>
          </Link>
        </Reveal>
        <Reveal delay={0.1}>
          <Link
            href="/donate#give"
            className="group flex h-full flex-col gap-2 rounded-3xl border border-line bg-parchment p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-saffron-deep">
              Donate
            </p>
            <p className="font-display text-xl font-bold text-forest-deep">
              Support the care →
            </p>
            <p className="text-sm leading-relaxed text-moss">
              A UPI QR opens straight away. Every rupee goes to the animals.
            </p>
          </Link>
        </Reveal>
        <Reveal delay={0.2}>
          <Link
            href="/report"
            className="group flex h-full flex-col gap-2 rounded-3xl border border-line bg-parchment p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-glow"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-saffron-deep">
              Report
            </p>
            <p className="font-display text-xl font-bold text-forest-deep">
              Tell us about an animal →
            </p>
            <p className="text-sm leading-relaxed text-moss">
              Saw an injured dog? Share a photo and a location — our team
              takes it from there.
            </p>
          </Link>
        </Reveal>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        aria-labelledby="faq-h"
        className="container-page scroll-mt-24 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <SectionHeading
              eyebrow="Frequently asked questions"
              title="Common questions, plain answers."
            />
          </Reveal>

          <ul className="mt-10 space-y-3">
            {FAQS.map((entry) => (
              <li
                key={entry.question}
                className="rounded-2xl border border-line bg-parchment shadow-soft"
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-5 sm:p-6">
                    <h3 className="font-display text-base font-semibold leading-snug text-forest-deep sm:text-lg">
                      {entry.question}
                    </h3>
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 text-forest transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-charcoal/80 sm:px-6 sm:pb-6 sm:text-base">
                    {entry.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <ButtonLink href="/volunteer" size="lg">
              Volunteer with us
            </ButtonLink>
            <ButtonLink href="/donate#give" variant="outline" size="lg">
              Donate now
            </ButtonLink>
          </div>
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
              optional and are only visible to the responding team.
            </li>
            <li>
              <strong>Donors:</strong> donation records are private. Public
              campaign pages show totals and supporter counts only.
            </li>
            <li>
              <strong>Volunteers:</strong> personal phone numbers and addresses
              are never shown on public pages.
            </li>
            <li>
              <strong>Adopters:</strong> the details in your adoption request
              are visible only to the adoption coordinators reviewing your
              application.
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
              <strong>Approximate location only:</strong> public profiles show
              a general area of the campus, not exact coordinates.
            </li>
            <li>
              <strong>No live tracking:</strong> we do not publish real-time
              movements of the community animals.
            </li>
            <li>
              <strong>Vulnerable animals:</strong> admins can hide any animal
              from public listings during medical care or when there is any
              risk of harm.
            </li>
            <li>
              <strong>Respectful photography:</strong> graphic injury photos
              stay inside internal case records; public stories show recovery
              images instead.
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}
