import { Hero } from "@/components/home/Hero";
import { Mission } from "@/components/home/Mission";

import { FeaturedRescues } from "@/components/home/FeaturedRescues";
import { IdentitySection } from "@/components/home/IdentitySection";
import { Transformations, buildTransformationPairs } from "@/components/home/Transformations";
import { Compawnions } from "@/components/home/Compawnions";
import { HelpBand } from "@/components/home/HelpBand";
import { DonateCta } from "@/components/home/DonateCta";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";

import { getHomeContent, getHelpContent } from "@/services/content";
import { listMedia } from "@/lib/media";

export default async function HomePage() {
  const [
    animals,
    stories,
    homeContent,
    helpContent,
    heroMedia,
    transformationMedia,
    adoptMedia,
  ] = await Promise.all([
    listAnimals(),
    listStories(),
    getHomeContent(),
    getHelpContent(),
    listMedia("hero"),
    listMedia("transformation"),
    listMedia("adopt"),
  ]);

  const cmsHero = homeContent.find((c) => c.section === "Hero");
  const cmsMission = homeContent.find((c) => c.section === "Mission");

  const cmsFeatured = homeContent.find((c) => c.section === "Featured");
  const cmsHelp = helpContent.find((c) => c.section === "Emergency Help");

  const heroDog =
    animals.find((a) => a.slug === "simba") ??
    animals.find((a) => a.species === "dog");
  const heroCat = animals.find((a) => a.species === "cat");
  const identityAnimal = heroDog ?? animals[0];

  // Per-animal cover photos, keyed by filename in public/images/adopt/ —
  // the hero foreground uses these (see public/images/adopt/README.md).
  const covers: Record<string, string> = {};
  for (const m of adoptMedia) {
    const file = m.src.split("/").pop() ?? "";
    const key = file.replace(/\.[^.]+$/, "").split("--")[0].toLowerCase();
    if (key && !(key in covers)) covers[key] = m.src;
  }

  const withPhoto = (a?: typeof heroDog) =>
    a && {
      ...a,
      photoUrl: a.photos.find((p) => p.url)?.url ?? covers[a.slug],
    };

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

      <FeaturedRescues animals={animals} cms={cmsFeatured} />
      <IdentitySection animal={identityAnimal} />
      <Transformations pairs={transformationPairs} />
      <Compawnions animals={animals} />
      <HelpBand cms={cmsHelp} />
      <DonateCta />
    </>
  );
}
