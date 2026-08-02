import { listMedia } from "@/lib/media";
import { IMAGE_FOLDERS, type MediaCollection } from "@/lib/image-config";
import {
  SHELTER_MEMBERS,
  WORK_SECTIONS,
  KNOWLEDGE_ARTICLES,
  type ShelterMember,
  type KnowledgeArticle,
  type WorkSectionContent,
} from "@/lib/our-work/content";
import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";

/**
 * Server-only photo resolver for the "Our Work" content (shelter family,
 * work sections, knowledge articles). Both the /stories page and the homepage
 * previews call this so they show the SAME photographs from the SAME data —
 * add a shelter member or article in lib/our-work/content.ts and it appears
 * in both places with no extra wiring.
 *
 * Lifted verbatim from the original app/stories/page.tsx so its output is
 * unchanged; the FOLDERS order matters (byStem is first-wins).
 */

export type WorkSectionWithPhotos = WorkSectionContent & { photos: SlidePhoto[] };

export interface ResolvedOurWork {
  shelter: ShelterMember[];
  sections: WorkSectionWithPhotos[];
  articles: KnowledgeArticle[];
  heroShot?: SlidePhoto;
}

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

export async function resolveOurWorkPhotos(): Promise<ResolvedOurWork> {
  const collections = await Promise.all(FOLDERS.map((f) => listMedia(f)));
  const all = collections.flat();

  const stills = all.filter((m) => /\.(jpe?g|png|webp|avif)$/i.test(m.src));
  const videos = all.filter((m) => /\.mp4$/i.test(m.src));

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
  for (const m of videos) {
    const s = stemOf(m.src);
    if (s && !byStem.has(s)) {
      byStem.set(s, { src: m.src, alt: m.alt });
    }
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
      target: m.photoKeys.length,
      offset: i * 5 + 3,
    }),
  }));

  const sections: WorkSectionWithPhotos[] = WORK_SECTIONS.map((s, i) => ({
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
  const heroShot = byStem.get("story-05") ?? byStem.get("simba") ?? pool[0];

  return { shelter, sections, articles, heroShot };
}
