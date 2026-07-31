import { Hero } from "@/components/home/Hero";
import { Mission } from "@/components/home/Mission";

import { FeaturedRescues } from "@/components/home/FeaturedRescues";
import { Transformations, buildTransformationPairs } from "@/components/home/Transformations";
import { Compawnions } from "@/components/home/Compawnions";
import { HelpBand } from "@/components/home/HelpBand";
import { DonateCta } from "@/components/home/DonateCta";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";

import { getHomeContent, getHelpContent } from "@/services/content";
import { listMedia } from "@/lib/media";
import { IMAGE_FOLDERS } from "@/lib/image-config";
import { withCoverPhotos } from "@/lib/animal-covers";

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
    listMedia(IMAGE_FOLDERS.hero),
    listMedia(IMAGE_FOLDERS.transformation),
    listMedia(IMAGE_FOLDERS.adopt),
  ]);

  const cmsHero = homeContent.find((c) => c.section === "Hero");
  const cmsMission = homeContent.find((c) => c.section === "Mission");

  const cmsFeatured = homeContent.find((c) => c.section === "Featured");
  const cmsHelp = helpContent.find((c) => c.section === "Emergency Help");

  const heroDog =
    animals.find((a) => a.slug === "simba") ??
    animals.find((a) => a.species === "dog");
  const heroCat = animals.find((a) => a.species === "cat");

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

  // Give every animal its filesystem cover the same way /adopt does. Without
  // this the cards fall through to the illustrated SVG portrait whenever the
  // database has an animal but no uploaded photo for it — which put thirteen
  // cartoon dogs on the home page while real photographs sat in
  // public/images/adopt/ unused.
  //
  // Featured Rescues and Com-Paw-Nions each check their own override folder
  // first (public/images/featured-dogs/, public/images/companions/) so a
  // different photo can be dropped in for just that section — falling back
  // to the shared adopt/ cover when no override exists, same as everywhere
  // else. See lib/image-config.ts.
  const [animalsWithCovers, featuredAnimals, companionAnimals] = await Promise.all([
    withCoverPhotos(animals),
    withCoverPhotos(animals, IMAGE_FOLDERS.featuredDogs),
    withCoverPhotos(animals, IMAGE_FOLDERS.companions),
  ]);

  const transformationPairs = buildTransformationPairs(transformationMedia, stories);

  return (
    <>
      <Hero
        cms={cmsHero}
        media={heroMedia}
        dog={withPhoto(heroDog)}
        cat={withPhoto(heroCat)}
      />
      <Mission cms={cmsMission} animals={animalsWithCovers.slice(0, 2)} />

      <FeaturedRescues animals={featuredAnimals} cms={cmsFeatured} />
      <Transformations pairs={transformationPairs} />
      <Compawnions animals={companionAnimals} />
      <HelpBand cms={cmsHelp} />
      <DonateCta />
    </>
  );
}
