import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_ANIMALS } from "@/lib/demo/animals";

export const dynamic = "force-dynamic";

/**
 * Canonical scan URL: /dog/DOG00023. Resolves the animal by public_id and
 * redirects to the existing /animal/[slug] profile with the ?via=qr scan
 * greeting flag. Kept as a redirect (not its own page) so all profile
 * rendering logic stays in one place; the QR code just prints a stable,
 * printable URL that the animal's real slug is allowed to move behind.
 */
export default async function DogByPublicId({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const publicIdUpper = decodeURIComponent(publicId).toUpperCase();

  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("animals")
      .select("slug, is_public")
      .eq("public_id", publicIdUpper)
      .maybeSingle();
    if (data?.slug && data.is_public) {
      redirect(`/animal/${data.slug}?via=qr`);
    }
    // Not found in DB — fall through to demo dataset in case it's a demo animal.
  }

  const demo = DEMO_ANIMALS.find((a) => a.slug === publicIdUpper.toLowerCase());
  if (demo) redirect(`/animal/${demo.slug}?via=qr`);

  notFound();
}
