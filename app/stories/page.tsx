import type { Metadata } from "next";
import { listMedia } from "@/lib/media";
import { IMAGE_FOLDERS, type MediaCollection } from "@/lib/image-config";
import {
  SHELTER_MEMBERS,
  WORK_SECTIONS,
  KNOWLEDGE_ARTICLES,
  type ShelterMember,
  type KnowledgeArticle,
} from "@/lib/our-work/content";
import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";
import {
  OurWorkHero,
  WorkSection,
  ShelterFamilySection,
  KnowledgeCentreSection,
  OurWorkFooterCta,
} from "@/components/our-work/OurWorkSections";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "A year of KGP PAWS on IIT Kharagpur's campus — feeding, rescue, sterilization, vaccination, chemotherapy, daily medical care and adoption, told through real photographs.",
  alternates: { canonical: "/stories" },
};

/** All the image folders the page might read from. Kept in one place so we
 *  only walk the filesystem once. */
const FOLDERS: MediaCollection[] = [
  IMAGE_FOLDERS.adopt,
  IMAGE_FOLDERS.stories,
  IMAGE_FOLDERS.donationFeeding,
  IMAGE_FOLDERS.donationMedical,
  IMAGE_FOLDERS.donationSterilization,
  IMAGE_FOLDERS.donationVaccination,
  IMAGE_FOLDERS.donationRescue,
  IMAGE_FOLDERS.heroGrid,
];

/** Turn a `/images/donation/medical/medical-01.jpg` src into `medical-01` so
 *  the content module can name photos without paths. */
function stemOf(src: string): string {
  const file = src.split("/").pop() ?? "";
  return file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
}

export default async function OurWorkPage() {
  const collections = await Promise.all(FOLDERS.map((f) => listMedia(f)));
  const all = collections.flat();

  // Only rasterised images — the hero-grid folder holds a couple of MP4s, and
  // the slideshow uses next/image, not <video>.
  const stills = all.filter((m) => /\.(jpe?g|png|webp|avif)$/i.test(m.src));

  const byStem = new Map<string, SlidePhoto>();
  const byFolder = new Map<string, SlidePhoto[]>();
  for (const m of stills) {
    const s = stemOf(m.src);
    if (s && !byStem.has(s)) {
      byStem.set(s, { src: m.src, alt: m.alt, blurDataURL: m.blurDataURL });
    }
    const list = byFolder.get(m.collection) ?? [];
    list.push({ src: m.src, alt: m.alt, blurDataURL: m.blurDataURL });
    byFolder.set(m.collection, list);
  }

  const pool: SlidePhoto[] = stills.map((m) => ({
    src: m.src,
    alt: m.alt,
    blurDataURL: m.blurDataURL,
  }));

  /**
   * Photos for a section, in order of preference:
   *   1. named stems from the content module (own photography)
   *   2. everything in the section's preferred folder(s)
   *   3. the general pool, so shorter folders still fill up
   */
  function pickFor({
    photoKeys,
    folders,
    target,
    offset,
  }: {
    photoKeys: string[];
    folders: string[];
    target: number;
    offset: number;
  }): SlidePhoto[] {
    const seen = new Set<string>();
    const out: SlidePhoto[] = [];
    const push = (p?: SlidePhoto) => {
      if (!p || seen.has(p.src) || out.length >= target) return;
      seen.add(p.src);
      out.push(p);
    };

    for (const key of photoKeys) push(byStem.get(key));
    for (const folder of folders) {
      const list = byFolder.get(folder) ?? [];
      for (const p of list) push(p);
    }
    for (let i = 0; i < pool.length && out.length < target; i++) {
      push(pool[(i + offset) % pool.length]);
    }
    return out;
  }

  const shelter: ShelterMember[] = SHELTER_MEMBERS.map((m, i) => ({
    ...m,
    photos: pickFor({
      photoKeys: m.photoKeys,
      folders: [IMAGE_FOLDERS.adopt, IMAGE_FOLDERS.stories, IMAGE_FOLDERS.heroGrid],
      target: 5,
      offset: i * 5 + 3,
    }),
  }));

  const sections = WORK_SECTIONS.map((s, i) => ({
    ...s,
    photos: pickFor({
      photoKeys: s.photoKeys,
      folders: s.folders,
      target: s.targetCount,
      offset: i * 3 + 7,
    }),
  }));

  const articles: KnowledgeArticle[] = KNOWLEDGE_ARTICLES.map((a, i) => ({
    ...a,
    photo:
      byStem.get(a.photoKey) ??
      pool[(i * 5 + 2) % Math.max(1, pool.length)],
  }));

  // Hero shot — a strong, warm image if we have one, otherwise anything.
  const heroShot =
    byStem.get("story-05") ??
    byStem.get("bunti") ??
    pool[0];

  return (
    <div className="bg-cream">
      <OurWorkHero shot={heroShot} />

      <ShelterFamilySection members={shelter} />

      {sections.map((s) => (
        <WorkSection
          key={s.id}
          id={s.id}
          eyebrow={s.eyebrow}
          title={s.title}
          intro={s.intro}
          description={s.description}
          photos={s.photos}
          tone={s.tone}
          aspect={s.aspect}
        />
      ))}

      <KnowledgeCentreSection articles={articles} />

      <OurWorkFooterCta />
    </div>
  );
}
