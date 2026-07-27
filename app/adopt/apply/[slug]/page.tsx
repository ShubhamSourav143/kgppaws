import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAnimal, listAnimals } from "@/services/animals";
import { withCoverPhoto } from "@/lib/animal-covers";
import { ApplyFlow } from "@/components/adopt/ApplyFlow";

export async function generateStaticParams() {
  const animals = await listAnimals();
  return animals
    .filter((a) => a.adoption === "available" || a.adoption === "foster_needed")
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const animal = await getAnimal(slug);
  return {
    title: animal ? `Adopt ${animal.name} — Application` : "Adoption application",
    robots: { index: false },
  };
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const animal = await getAnimal(slug);
  if (!animal) notFound();
  if (animal.adoption !== "available" && animal.adoption !== "foster_needed") {
    notFound();
  }
  return <ApplyFlow animal={await withCoverPhoto(animal)} />;
}
