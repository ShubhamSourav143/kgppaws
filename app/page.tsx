import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { ImpactStats } from "@/components/home/ImpactStats";
import { ShelterFamilyPreview } from "@/components/home/ShelterFamilyPreview";
import { FeaturedRescues } from "@/components/home/FeaturedRescues";
import { OurWorkPreview } from "@/components/home/OurWorkPreview";
import { KnowledgePreview } from "@/components/home/KnowledgePreview";
import { VolunteerPreview } from "@/components/home/VolunteerPreview";
import { DonateCta } from "@/components/home/DonateCta";
import { HelpBand } from "@/components/home/HelpBand";
import { FinalCta } from "@/components/home/FinalCta";

import { listAnimals } from "@/services/animals";
import { getImpactMetrics } from "@/services/metrics";
import { getHomeContent, getHelpContent } from "@/services/content";
import { resolveOurWorkPhotos } from "@/lib/our-work/photos";
import { withCoverPhotos } from "@/lib/animal-covers";
import { IMAGE_FOLDERS } from "@/lib/image-config";
import { VOLUNTEER_ROLE_CARDS } from "@/lib/volunteer/roles";

/**
 * ISR: rebuilt in the background every 5 minutes. Keeps the home OFF Vercel's
 * per-deployment Serverless Function count — the site's public pages don't need
 * per-request rendering, just periodic refreshes as CMS data changes.
 */
export const revalidate = 300;

/**
 * The homepage is a live summary of the whole site. Every section below the
 * hero previews a dedicated page and pulls from that page's own data source,
 * so new animals, articles, shelter members, work sections or volunteer roles
 * appear here automatically — nothing is hand-duplicated.
 */
export default async function HomePage() {
  const [animals, metrics, homeContent, helpContent, ourWork] =
    await Promise.all([
      listAnimals(),
      getImpactMetrics(),
      getHomeContent(),
      getHelpContent(),
      resolveOurWorkPhotos(),
    ]);

  // Adoptable animals get their filesystem cover the same way /adopt does.
  const featuredAnimals = await withCoverPhotos(
    animals,
    IMAGE_FOLDERS.featuredDogs
  );

  const cmsHero = homeContent.find((c) => c.section === "Hero");
  const cmsStats = homeContent.find((c) => c.section === "Stats");
  const cmsFeatured = homeContent.find((c) => c.section === "Featured");
  const cmsHelp = helpContent.find((c) => c.section === "Emergency Help");

  return (
    <>
      <Hero cms={cmsHero} />
      <Intro />
      <ImpactStats metrics={metrics} cms={cmsStats} />
      <ShelterFamilyPreview members={ourWork.shelter} />
      <FeaturedRescues animals={featuredAnimals} cms={cmsFeatured} />
      <OurWorkPreview sections={ourWork.sections} />
      <KnowledgePreview articles={ourWork.articles} />
      <VolunteerPreview roles={VOLUNTEER_ROLE_CARDS} />
      <DonateCta />
      <HelpBand cms={cmsHelp} />
      <FinalCta />
    </>
  );
}
