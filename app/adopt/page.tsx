import type { Metadata } from "next";
import { listAnimals } from "@/services/animals";
import { getAdoptionContent } from "@/services/content";
import { AdoptExplorer } from "@/components/adopt/AdoptExplorer";

export const metadata: Metadata = {
  title: "Adopt",
  description:
    "Maybe your best friend is waiting. Meet the adoptable dogs and cats of IIT Kharagpur — vaccinated, assessed, and full of personality.",
  alternates: { canonical: "/adopt" },
};

export default async function AdoptPage() {
  const [animals, content] = await Promise.all([
    listAnimals(),
    getAdoptionContent()
  ]);

  const intro = content.find(c => c.section === "intro");

  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3 text-terracotta-deep">Adopt</p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] text-forest-deep sm:text-5xl lg:text-6xl">
          {intro?.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-moss">
          {intro?.body}
        </p>
      </header>
      <AdoptExplorer animals={animals} />
    </div>
  );
}
