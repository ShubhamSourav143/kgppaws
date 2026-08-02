import type { Metadata } from "next";
import {
  OurWorkHero,
  WorkSection,
  ShelterFamilySection,
  KnowledgeCentreSection,
  OurWorkFooterCta,
} from "@/components/our-work/OurWorkSections";
import { resolveOurWorkPhotos } from "@/lib/our-work/photos";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "A year of KGP PAWS on IIT Kharagpur's campus — feeding, rescue, sterilization, vaccination, chemotherapy, daily medical care and adoption, told through real photographs.",
  alternates: { canonical: "/stories" },
};

export default async function OurWorkPage() {
  const { shelter, sections, articles, heroShot } = await resolveOurWorkPhotos();

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
