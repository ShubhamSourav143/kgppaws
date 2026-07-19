import { Hero } from "@/components/home/Hero";
import { Mission } from "@/components/home/Mission";
import { ImpactStats } from "@/components/home/ImpactStats";
import { FeaturedRescues } from "@/components/home/FeaturedRescues";
import { IdentitySection } from "@/components/home/IdentitySection";
import { Transformations, buildTransformationPairs } from "@/components/home/Transformations";
import { Compawnions } from "@/components/home/Compawnions";
import { GalleryPreview, type GalleryPreviewPhoto } from "@/components/home/GalleryPreview";
import { HelpBand } from "@/components/home/HelpBand";
import { DonateCta } from "@/components/home/DonateCta";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";
import { listCampaigns } from "@/services/campaigns";
import { getImpactMetrics } from "@/services/metrics";
import { getHomeContent, getHelpContent } from "@/services/content";
import { listMedia } from "@/lib/media";

export default async function HomePage() {
  const [
    animals,
    stories,
    campaigns,
    metrics,
    homeContent,
    helpContent,
    heroMedia,
    galleryMedia,
    transformationMedia,
  ] = await Promise.all([
    listAnimals(),
    listStories(),
    listCampaigns(),
    getImpactMetrics(),
    getHomeContent(),
    getHelpContent(),
    listMedia("hero"),
    listMedia("gallery"),
    listMedia("transformation"),
  ]);

  const cmsHero = homeContent.find((c) => c.section === "Hero");
  const cmsMission = homeContent.find((c) => c.section === "Mission");
  const cmsStats = homeContent.find((c) => c.section === "Stats");
  const cmsFeatured = homeContent.find((c) => c.section === "Featured");
  const cmsHelp = helpContent.find((c) => c.section === "Emergency Help");

  const heroDog =
    animals.find((a) => a.slug === "simba") ??
    animals.find((a) => a.species === "dog");
  const heroCat = animals.find((a) => a.species === "cat");
  const identityAnimal = heroDog ?? animals[0];

  const withPhoto = (a?: typeof heroDog) =>
    a && { ...a, photoUrl: a.photos.find((p) => p.url)?.url };

  // Real (non-demo) photography only — nothing fictional appears in the gallery strip.
  const cmsPhotos: GalleryPreviewPhoto[] = [
    ...animals.flatMap((a) =>
      a.photos.filter((p) => p.url).map((p) => ({ src: p.url!, alt: p.caption || a.name }))
    ),
    ...stories.flatMap((s) =>
      s.photos.filter((p) => p.url).map((p) => ({ src: p.url, alt: p.caption || s.title }))
    ),
  ];

  const transformationPairs = buildTransformationPairs(transformationMedia, stories);

  return (
    <>
      <Hero
        cms={cmsHero}
        media={heroMedia}
        dog={withPhoto(heroDog)}
        cat={withPhoto(heroCat)}
      />
      <Mission cms={cmsMission} animals={animals.slice(0, 2)} />
      <ImpactStats metrics={metrics} cms={cmsStats} />
      <FeaturedRescues animals={animals} cms={cmsFeatured} />
      <IdentitySection animal={identityAnimal} />
      <Transformations pairs={transformationPairs} />
      <Compawnions animals={animals} />
      <GalleryPreview media={galleryMedia} cmsPhotos={cmsPhotos} />
      <HelpBand cms={cmsHelp} />
      <DonateCta campaigns={campaigns} />
    </>
  );
}
