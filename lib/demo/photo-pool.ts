/**
 * Species split for the shared collage pool (`public/images/hero-grid/`).
 *
 * Those files are temporary royalty-free placeholders standing in for real
 * KGP PAWS photography, and their filenames (`grid-07.jpg`) carry no subject
 * information — so the split below was established by looking at each image.
 * It exists so a dog's card is never padded out with a photo of a cat.
 *
 * This is placeholder scaffolding: once animals have real uploaded galleries
 * of their own, those photos win and the pool is no longer drawn from.
 * If you add or replace files in hero-grid/, update this list.
 */
const CAT_STEMS = new Set(["grid-05"]);

function stemOf(src: string): string {
  return (src.split("/").pop() ?? "").replace(/\.[^.]+$/, "").toLowerCase();
}

/** Filter a pool of image srcs down to those matching an animal's species. */
export function poolForSpecies(pool: string[], species: string): string[] {
  const wantCat = species === "cat";
  return pool.filter((src) => CAT_STEMS.has(stemOf(src)) === wantCat);
}
