import type { Metadata } from "next";
import { listCampaigns } from "@/services/campaigns";
import { listMedia } from "@/lib/media";
import { IMAGE_FOLDERS } from "@/lib/image-config";
import { DEMO_DONORS } from "@/lib/demo/donors";
import { fetchDonorsFromSheet } from "@/lib/google-sheets";
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

/** ISR: rebuild every 5 min so new campaigns and donor entries appear without
 *  paying for a per-request Serverless Function on Vercel Hobby. */
export const revalidate = 300;

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
  const [campaigns, adoptMedia, gridMedia, ...donationMedia] = await Promise.all([
    listCampaigns(),
    listMedia(IMAGE_FOLDERS.adopt),
    listMedia(IMAGE_FOLDERS.heroGrid),
    listMedia(IMAGE_FOLDERS.donationFeeding),
    listMedia(IMAGE_FOLDERS.donationSterilization),
    listMedia(IMAGE_FOLDERS.donationVaccination),
    listMedia(IMAGE_FOLDERS.donationMedical),
    listMedia(IMAGE_FOLDERS.donationRescue),
  ]);

  // Two disjoint pools so no photo appears in two sections of the donate page:
  //   * campaign galleries pull from public/images/donation/<programme>/,
  //     one folder per programme (dedicated per-campaign stems — see
  //     lib/donate/editorial.ts)
  //   * the hero collage, "Why donate" tiles and final CTA backdrop pull from
  //     the shared adopt/ + hero-grid/ pool, and are sliced disjointly below.
  const byStem = new Map<string, Shot>();
  for (const m of donationMedia.flat()) {
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

  // Donor wall. The Donors tab in the sheet has three columns —
  // Name | Date | Amount — matching the row shape below. Sorting and
  // date validation happen inside the wall component.
  const sheetDonors = await fetchDonorsFromSheet();
  const donorSource = sheetDonors ?? DEMO_DONORS;
  const donorsAreDemo = !sheetDonors;

  const donors: DonorRow[] = donorSource.map((d, i) => ({
    id: "id" in d ? (d as { id: string }).id : `sheet-${i}`,
    name: d.name,
    date: d.date,
    amount: d.amount,
  }));

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
      <DonorWall donors={donors} isDemo={donorsAreDemo} />

      {/* 5 · Why donate */}
      <WhyDonate shots={whyShots} />

      {/* 6 · Final CTA */}
      <FinalCta shots={ctaShots} />
    </div>
  );
}
