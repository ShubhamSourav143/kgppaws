import type { MetadataRoute } from "next";
import { listAnimals } from "@/services/animals";
import { listStories } from "@/services/stories";
import { SITE } from "@/lib/config";

/** ISR: sitemap regenerates every hour instead of per request. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [animals, stories] = await Promise.all([listAnimals(), listStories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/adopt",
    "/donate",
    "/stories",
    "/report",
    "/about",
    "/volunteer",
  ].map((path) => ({
    url: `${SITE.url}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const animalRoutes: MetadataRoute.Sitemap = animals.map((a) => ({
    url: `${SITE.url}/animal/${a.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const storyRoutes: MetadataRoute.Sitemap = stories.map((s) => ({
    url: `${SITE.url}/stories/${s.slug}`,
    lastModified: s.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...animalRoutes, ...storyRoutes];
}
