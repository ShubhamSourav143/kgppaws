import type { Metadata } from "next";
import { listCampaigns } from "@/services/campaigns";
import { listMedia } from "@/lib/media";
import { DEMO_DONORS } from "@/lib/demo/donors";
import { editorialFor } from "@/lib/donate/editorial";
import { CampaignFeature } from "@/components/donate/CampaignFeature";
import { DonorWall, type DonorRow } from "@/components/donate/DonorWall";
import {
  DonateHero,
  ImpactStats,
  WhyDonate,
  FinalCta,
  type Shot,
} from "@/components/donate/DonateSections";
import type { GalleryPhoto } from "@/components/donate/CampaignGallery";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Every donation changes a life. Fund the feeding, vaccination, sterilization and emergency care of 350+ campus animals at IIT Kharagpur.",
  alternates: { canonical: "/donate" },
};

export default async function DonatePage() {
  // Campaign money comes from the backend exactly as before — this page only
  // changes how it's told. Photography is resolved from the filesystem media
  // manifest, keyed by the stems in lib/donate/editorial.ts.
  const [campaigns, adoptMedia, gridMedia, donateMedia] = await Promise.all([
    listCampaigns(),
    listMedia("adopt"),
    listMedia("hero-grid"),
    listMedia("donate"),
  ]);

  // Two disjoint pools so no photo appears in two sections of the donate page:
  //   * campaign galleries pull from donate/*.jpg (dedicated per-campaign stems
  //     — see lib/donate/editorial.ts)
  //   * the hero collage, "Why donate" tiles and final CTA backdrop pull from
  //     the shared adopt/ + hero-grid/ pool, and are sliced disjointly below.
  const byStem = new Map<string, Shot>();
  for (const m of donateMedia) {
    const file = m.src.split("/").pop() ?? "";
    const stem = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (stem && !byStem.has(stem)) {
      byStem.set(stem, { src: m.src, alt: m.alt, blurDataURL: m.blurDataURL });
    }
  }
  const generalPool: Shot[] = [...adoptMedia, ...gridMedia].map((m) => ({
    src: m.src,
    alt: m.alt,
    blurDataURL: m.blurDataURL,
  }));
  // Everything outside the campaign galleries draws from a single unique-slot
  // sequence, so the hero, "why donate" cards and final backdrop each get their
  // own set of photos with no overlap.
  const heroShots = generalPool.slice(0, 12);
  const whyShots = generalPool.slice(12, 16);
  const ctaShots = generalPool.slice(16, 17);

  /** Resolve a campaign's gallery stems, dropping any file that isn't there. */
  const galleryFor = (stems: string[]): GalleryPhoto[] =>
    stems
      .map((s) => byStem.get(s))
      .filter((p): p is Shot => Boolean(p))
      .map((p, i) => ({
        ...p,
        // the manifest derives alt from the filename, which says nothing
        // useful here — describe the animal instead
        alt: p.alt || `Campus animal cared for by KGP PAWS, photo ${i + 1}`,
      }));

  // The showcase is about the four standing programmes. One-animal appeals
  // ("Simba's Recovery Fund" and anything else filed under recovery/treatment,
  // usually carrying an `animalSlug`) belong on that animal's own page — shown
  // here they read as a fifth programme and duplicate the emergency fund's
  // story. They stay fully donatable through the panel below; this only
  // decides what the page tells a story about.
  const programmes = campaigns.filter(
    (c) => c.category !== "recovery" && c.category !== "treatment" && !c.animalSlug
  );

  const features = programmes.map((campaign) => {
    const editorial = editorialFor(campaign);
    return { campaign, editorial, photos: galleryFor(editorial.gallery) };
  });

  // Donor wall. There is no public donor feed in the schema yet, so this runs
  // on clearly-labelled demo entries; when one exists it drops in here
  // unchanged, since the wall only needs {name, date, campaign, amount}.
  //
  // The demo rows name the seed campaigns, which won't match a connected
  // database — so attach each one to a campaign that actually exists (its own
  // where the slug lines up, otherwise spread round-robin). Without this the
  // wall silently empties the moment a real database is connected.
  const wallCampaigns = programmes.length ? programmes : campaigns;
  const byRealSlug = new Map(wallCampaigns.map((c) => [c.slug, c]));
  const donors: DonorRow[] = wallCampaigns.length
    ? DEMO_DONORS.map((d, i) => {
        const target =
          byRealSlug.get(d.campaignSlug) ??
          wallCampaigns[i % wallCampaigns.length];
        return {
          id: d.id,
          name: d.name,
          date: d.date,
          campaignSlug: target.slug,
          campaignTitle: target.title,
          amount: d.amount,
        };
      })
    : [];

  // The donor rows are illustrative regardless of where the campaigns came
  // from — the schema has no public donor feed yet, so they are ALWAYS demo
  // and must always say so. Tying this to `campaign.demo` would have hidden
  // the label as soon as a real database was connected, leaving invented
  // names looking like genuine donations.
  const donorsAreDemo = true;

  return (
    <div className="bg-cream">
      {/* 1 · Hero */}
      <DonateHero shots={heroShots} />

      {/* 2 · Our impact */}
      <ImpactStats />

      {/* 3 · Campaigns */}
      <section
        id="campaigns"
        aria-labelledby="campaigns-h"
        className="scroll-mt-24 bg-cream py-20 sm:py-28"
      >
        <div className="container-page">
          <div className="max-w-2xl">
            <Reveal>
              <p className="eyebrow mb-4 text-saffron-deep">Where you can help</p>
              <h2
                id="campaigns-h"
                className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
              >
                Four programmes. One campus. Pick the one that moves you.
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="container-page mt-16 space-y-24 sm:mt-20 sm:space-y-32">
          {features.map((f, i) => (
            <CampaignFeature
              key={f.campaign.slug}
              campaign={f.campaign}
              editorial={f.editorial}
              photos={f.photos}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* NOTE: the "Give" section (donate form + expense ledger + this
          heading) has been fully removed at the user's request. There is no
          #give anchor left on the page — every "Donate Now" / "Donate to
          this" button still points at #give and is now a dead link with
          nothing to scroll to. */}

      {/* 4 · Transparency — donor wall */}
      <DonorWall donors={donors} campaigns={wallCampaigns} isDemo={donorsAreDemo} />

      {/* 5 · Why donate */}
      <WhyDonate shots={whyShots} />

      {/* 6 · Final CTA */}
      <FinalCta shots={ctaShots} />
    </div>
  );
}
