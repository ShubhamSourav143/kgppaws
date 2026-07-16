import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Tag not recognised",
  robots: { index: false },
};

/** Landing page for scans of deactivated / unknown QR tags. */
export default function ScanNotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <PawPrint className="h-12 w-12 text-sand" aria-hidden="true" />
      <h1 className="max-w-md text-balance font-display text-4xl font-bold text-forest-deep">
        Hmm — we don&apos;t recognise that tag.
      </h1>
      <p className="max-w-md text-moss">
        This QR tag may have been replaced or retired. If you&apos;re with an
        animal wearing it — especially one who looks like they need help —
        please let us know right away.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/report" variant="accent" size="lg">
          Report this animal
        </ButtonLink>
        <ButtonLink href="/adopt" variant="outline" size="lg">
          Browse all paws
        </ButtonLink>
      </div>
    </div>
  );
}
