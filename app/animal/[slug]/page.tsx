import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  HandHeart,
  Heart,
  Home,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { MedicalTimeline } from "@/components/animals/MedicalTimeline";
import { ShareButton } from "@/components/animals/ShareButton";
import { SaveButton } from "@/components/animals/SaveButton";
import { HealthChip, AdoptionChip, CareChips } from "@/components/animals/chips";
import { QrTagFlip } from "@/components/qr/QrTagFlip";
import { Reveal } from "@/components/motion/Reveal";
import { Chip } from "@/components/ui/Chip";
import { ButtonLink } from "@/components/ui/Button";
import { DemoNotice } from "@/components/ui/Section";
import { getAnimal, listAnimals } from "@/services/animals";
import { listCampaigns } from "@/services/campaigns";
import { zoneName } from "@/lib/demo/zones";
import { formatDate } from "@/lib/utils";
import { SITE } from "@/lib/config";

export async function generateStaticParams() {
  const animals = await listAnimals();
  return animals.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const animal = await getAnimal(slug);
  if (!animal) return { title: "Animal not found" };
  return {
    title: `${animal.name} · Digital Animal ID`,
    description: `${animal.name} (${animal.pawsId}) — ${animal.tagline} ${animal.ageLabel}, ${zoneName(animal.zoneId)}, IIT Kharagpur.`,
    alternates: { canonical: `/animal/${animal.slug}` },
    openGraph: {
      title: `${animal.name} — ${SITE.name} Digital Animal ID`,
      description: animal.tagline,
      type: "profile",
    },
  };
}

const STATUS_BANNER: Record<
  string,
  { label: string; className: string }
> = {
  healthy: { label: "Safe & Healthy", className: "bg-forest text-cream" },
  under_treatment: { label: "Under Treatment", className: "bg-terracotta text-parchment" },
  recovering: { label: "Recovering", className: "bg-sand text-forest-deep" },
  monitoring: { label: "Under Monitoring", className: "bg-moss text-cream" },
};

export default async function AnimalProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ via?: string }>;
}) {
  const [{ slug }, { via }] = await Promise.all([params, searchParams]);
  const [animal, campaigns] = await Promise.all([
    getAnimal(slug),
    listCampaigns(),
  ]);
  if (!animal) notFound();

  const fromQr = via === "qr";
  const linkedCampaign = campaigns.find((c) => c.animalSlug === animal.slug);
  const banner = STATUS_BANNER[animal.healthStatus];

  const facts: { label: string; value: string }[] = [
    { label: "Age", value: animal.ageLabel },
    { label: "Sex", value: animal.sex === "male" ? "Male" : animal.sex === "female" ? "Female" : "Unknown" },
    { label: "Species", value: animal.species === "dog" ? "Dog (Indie)" : animal.species === "cat" ? "Cat" : "Other" },
    { label: "Colour", value: animal.color },
    { label: "Size", value: animal.size[0].toUpperCase() + animal.size.slice(1) },
    { label: "Campus zone", value: zoneName(animal.zoneId) },
  ];

  return (
    <article>
      {/* QR scan greeting */}
      {fromQr && (
        <div className="bg-forest text-cream">
          <div className="container-page flex flex-col items-center gap-1 py-6 text-center">
            <p className="font-display text-2xl font-bold sm:text-3xl">
              You just met {animal.name} 🐾
            </p>
            <p className="text-sm text-sand">
              Here&apos;s a little about your new campus friend.
            </p>
          </div>
        </div>
      )}

      {/* identity header */}
      <header className="bg-parchment">
        <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="relative mx-auto w-full max-w-md">
            <AnimalPortrait
              animal={animal}
              idle
              frame="arch"
              photoUrl={animal.photos.find((p) => p.url)?.url}
              className="aspect-[4/4.6] shadow-lift"
            />
            <SaveButton
              slug={animal.slug}
              name={animal.name}
              className="absolute right-4 top-4"
            />
          </Reveal>

          <div>
            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.15em] ${banner.className}`}
                >
                  {banner.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 px-3 py-1.5 text-xs font-bold text-forest">
                  <BadgeCheck className="h-3.5 w-3.5 text-forest-bright" aria-hidden="true" />
                  QR-verified identity
                </span>
              </div>
              <h1 className="mt-4 font-display text-5xl font-bold text-forest-deep sm:text-6xl">
                {animal.name}
              </h1>
              <p className="mt-2 font-mono text-sm font-semibold tracking-wide text-moss">
                {animal.pawsId}
              </p>
              <p className="mt-4 max-w-lg font-display text-xl italic leading-snug text-terracotta-deep">
                “{animal.tagline}”
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <AdoptionChip status={animal.adoption} />
                <CareChips animal={animal} />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                {(animal.adoption === "available" ||
                  animal.adoption === "foster_needed") && (
                  <ButtonLink href={`/adopt/apply/${animal.slug}`} variant="accent" size="lg">
                    <Heart className="h-4 w-4" aria-hidden="true" />
                    {animal.adoption === "available" ? `Adopt ${animal.name}` : `Foster ${animal.name}`}
                  </ButtonLink>
                )}
                <ShareButton
                  title={`${animal.name} — KGP PAWS`}
                  text={`Meet ${animal.name}: ${animal.tagline}`}
                />
              </div>
              {animal.emergencyNote && (
                <p className="mt-5 rounded-2xl border border-terracotta/40 bg-clay p-4 text-sm font-semibold text-terracotta-deep">
                  {animal.emergencyNote}
                </p>
              )}
            </Reveal>
          </div>
        </div>
      </header>

      <div className="container-page grid gap-14 py-14 lg:grid-cols-[1.6fr_1fr]">
        {/* main column */}
        <div className="min-w-0 space-y-14">
          {/* about */}
          <section aria-labelledby="about-h">
            <Reveal>
              <h2 id="about-h" className="font-display text-3xl font-bold text-forest-deep">
                About me
              </h2>
              <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="rounded-2xl border border-line bg-parchment p-4">
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-moss">
                      {f.label}
                    </dt>
                    <dd className="mt-1 font-display text-lg font-bold text-forest-deep">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </section>

          {/* personality */}
          <section aria-labelledby="personality-h">
            <Reveal>
              <h2 id="personality-h" className="font-display text-3xl font-bold text-forest-deep">
                Personality
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                <Chip tone="forest" className="!px-4 !py-2 !text-sm">
                  {animal.friendliness === "friendly"
                    ? "Friendly"
                    : animal.friendliness === "selective"
                      ? "Selectively social"
                      : animal.friendliness === "cautious"
                        ? "Cautious — admire from a distance"
                        : "Shy — gentle approaches only"}
                </Chip>
                {animal.personality.map((t) => (
                  <Chip key={t} tone="sand" className="!px-4 !py-2 !text-sm">
                    {t}
                  </Chip>
                ))}
                {animal.goodWithPeople && (
                  <Chip tone="mist" className="!px-4 !py-2 !text-sm">Good with people</Chip>
                )}
                {animal.goodWithAnimals && (
                  <Chip tone="mist" className="!px-4 !py-2 !text-sm">Good with other animals</Chip>
                )}
              </div>
            </Reveal>
          </section>

          {/* my story */}
          <section aria-labelledby="story-h">
            <Reveal>
              <h2 id="story-h" className="font-display text-3xl font-bold text-forest-deep">
                My story
              </h2>
              <div className="prose-p:leading-relaxed mt-5 max-w-2xl space-y-4">
                {animal.bio.split("\n\n").map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-charcoal/85">
                    {para}
                  </p>
                ))}
              </div>
            </Reveal>
          </section>

          {/* medical timeline */}
          <section aria-labelledby="medical-h">
            <Reveal>
              <h2 id="medical-h" className="font-display text-3xl font-bold text-forest-deep">
                Medical timeline
              </h2>
              <p className="mt-2 text-sm text-moss">
                Public health record — maintained by KGP PAWS volunteers and vets.
              </p>
            </Reveal>
            <div className="mt-7">
              <MedicalTimeline events={animal.medicalTimeline} />
            </div>
          </section>

          {/* photo journey */}
          {animal.photos.length > 0 && (
            <section aria-labelledby="photos-h">
              <Reveal>
                <h2 id="photos-h" className="font-display text-3xl font-bold text-forest-deep">
                  Photo journey
                </h2>
              </Reveal>
              <div className="mt-6">
                <PhotoGallery
                  photos={animal.photos.map((p) => ({
                    id: p.id,
                    url: p.url,
                    caption: p.caption,
                    date: p.date ? formatDate(p.date) : undefined,
                  }))}
                  fallbackPalette={[animal.portrait.from, animal.portrait.to]}
                />
              </div>
            </section>
          )}

          {/* sightings */}
          <section aria-labelledby="sightings-h">
            <Reveal>
              <h2 id="sightings-h" className="font-display text-3xl font-bold text-forest-deep">
                Recent updates
              </h2>
              <ul className="mt-5 space-y-3">
                {animal.sightings.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-parchment p-4"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                    <div>
                      <p className="text-sm leading-relaxed text-charcoal/85">{s.note}</p>
                      <p className="mt-1 text-xs font-semibold text-moss">
                        {zoneName(s.zoneId)} · {formatDate(s.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {/* health card */}
          <Reveal>
            <section
              aria-labelledby="health-h"
              className="rounded-3xl border border-line bg-parchment p-6 shadow-soft"
            >
              <h2 id="health-h" className="font-display text-2xl font-bold text-forest-deep">
                My health
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-moss">Vaccination</dt>
                  <dd>
                    <Chip tone={animal.vaccinated ? "mist" : "clay"}>
                      {animal.vaccinated ? "Up to date" : "Pending"}
                    </Chip>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-moss">Sterilization</dt>
                  <dd>
                    <Chip tone={animal.sterilized ? "mist" : "clay"}>
                      {animal.sterilized ? "Done" : "Planned"}
                    </Chip>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-moss">Current status</dt>
                  <dd><HealthChip status={animal.healthStatus} /></dd>
                </div>
              </dl>
              <p className="mt-4 rounded-xl bg-mist p-3 text-xs leading-relaxed text-forest">
                {animal.healthNote}
              </p>
              <p className="mt-3 text-[11px] text-moss">
                Last health update: {formatDate(animal.lastHealthUpdate)}
              </p>
            </section>
          </Reveal>

          {/* tag */}
          <Reveal delay={0.1}>
            <section
              aria-labelledby="tag-h"
              className="rounded-3xl bg-forest-deep p-6 text-center"
            >
              <h2 id="tag-h" className="eyebrow text-sand">
                {animal.name}&apos;s PAWS tag
              </h2>
              <div className="mx-auto mt-4 max-w-[190px]">
                <QrTagFlip
                  name={animal.name}
                  pawsId={animal.pawsId}
                  qrToken={animal.qrToken}
                  idleSwing={false}
                />
              </div>
              <p className="mt-4 text-xs leading-relaxed text-cream/70">
                This exact tag hangs from {animal.name}&apos;s collar on campus.
                Scanning it opens this page.
              </p>
            </section>
          </Reveal>

          {/* help this paw */}
          <Reveal delay={0.15}>
            <section
              aria-labelledby="help-paw-h"
              className="rounded-3xl border border-line bg-parchment p-6 shadow-soft"
            >
              <h2 id="help-paw-h" className="font-display text-2xl font-bold text-forest-deep">
                Help this paw
              </h2>
              <div className="mt-4 space-y-3">
                {linkedCampaign && (
                  <ButtonLink
                    href={`/donate#${linkedCampaign.slug}`}
                    variant="accent"
                    className="w-full"
                  >
                    <HandHeart className="h-4 w-4" aria-hidden="true" />
                    Sponsor {animal.name}&apos;s care
                  </ButtonLink>
                )}
                <ButtonLink href="/donate" variant="primary" className="w-full">
                  Donate to KGP PAWS
                </ButtonLink>
                {(animal.adoption === "available" ||
                  animal.adoption === "foster_needed") && (
                  <ButtonLink
                    href={`/adopt/apply/${animal.slug}`}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    {animal.adoption === "available" ? "Start adoption inquiry" : "Offer to foster"}
                  </ButtonLink>
                )}
                <ButtonLink href="/report" variant="ghost" className="w-full">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Report a concern
                </ButtonLink>
              </div>
            </section>
          </Reveal>

          {animal.demo && (
            <DemoNotice>
              <Sparkles className="mr-1 inline h-3 w-3" aria-hidden="true" />
              {animal.name} is part of the clearly-labelled demo dataset.
            </DemoNotice>
          )}
        </aside>
      </div>

      {/* next paw footer */}
      <div className="border-t border-line bg-parchment">
        <div className="container-page flex flex-col items-center gap-4 py-12 text-center">
          <PawPrint className="h-7 w-7 text-terracotta" aria-hidden="true" />
          <p className="font-display text-2xl font-bold text-forest-deep">
            Every paw has a story. Meet another?
          </p>
          <ButtonLink href="/adopt" variant="outline" size="lg">
            Browse all paws
          </ButtonLink>
        </div>
      </div>

      <Link href="#main-content" className="sr-only">
        Back to top
      </Link>
    </article>
  );
}
