import { Hero } from "@/components/home/Hero";
import { ScanStory } from "@/components/home/ScanStory";
import { CampusHome } from "@/components/home/CampusHome";
import { Impact } from "@/components/home/Impact";
import { MeetThePaws } from "@/components/home/MeetThePaws";
import { DigitalIdentity } from "@/components/home/DigitalIdentity";
import { RealFaces, type RealFacePhoto } from "@/components/home/RealFaces";
import { StoriesPreview } from "@/components/home/StoriesPreview";
import { MapPreview } from "@/components/home/MapPreview";
import { HelpSection } from "@/components/home/HelpSection";
import { DonationImpact } from "@/components/home/DonationImpact";
import { JoinPack } from "@/components/home/JoinPack";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";
import { listCampaigns } from "@/services/campaigns";
import { getImpactMetrics } from "@/services/metrics";

export default async function HomePage() {
  const [animals, stories, campaigns, metrics] = await Promise.all([
    listAnimals(),
    listStories(),
    listCampaigns(),
    getImpactMetrics(),
  ]);

  const simba = animals.find((a) => a.slug === "simba") ?? animals[0];
  const featuredStories = stories.filter((s) => s.featured);
  const editorialPair = animals.filter((a) =>
    ["shanti", "rocket"].includes(a.slug)
  );

  // Real (non-demo) photography only — nothing fictional ever appears here.
  const realFacePhotos: RealFacePhoto[] = [
    ...animals.flatMap((a) =>
      a.photos
        .filter((p) => p.url)
        .map((p) => ({ url: p.url!, caption: p.caption || a.name, href: `/animal/${a.slug}` }))
    ),
    ...stories.flatMap((s) =>
      s.photos.map((p) => ({ url: p.url, caption: p.caption || s.title, href: `/stories/${s.slug}` }))
    ),
  ];

  return (
    <>
      <Hero />
      <ScanStory animal={simba} />
      <CampusHome animals={editorialPair.length ? editorialPair : animals.slice(0, 2)} />
      <Impact metrics={metrics} />
      <MeetThePaws animals={animals} />
      <DigitalIdentity animal={simba} />
      <RealFaces photos={realFacePhotos.slice(0, 12)} />
      <StoriesPreview
        stories={featuredStories.length >= 3 ? featuredStories : stories}
      />
      <MapPreview animals={animals} />
      <HelpSection />
      <DonationImpact campaigns={campaigns} />
      <JoinPack />
    </>
  );
}
