import type { Metadata } from "next";
import { PawMark } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <div className="container-page flex min-h-[65vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl bg-mist">
        <PawMark className="h-10 w-10 text-forest" />
      </span>
      <p className="eyebrow text-terracotta-deep">No connection</p>
      <h1 className="max-w-md text-balance font-display text-4xl font-bold text-forest-deep">
        You&apos;re offline.
      </h1>
      <p className="max-w-md text-moss">
        Campus signal comes and goes. Pages you&apos;ve already opened still work —
        including any paw profile you looked at recently.
      </p>
      <ButtonLink href="/" size="lg">
        Try again
      </ButtonLink>
      <p className="mt-2 max-w-md text-sm text-moss">
        If an animal needs urgent help and you have no data, call the emergency
        contact saved on their profile, or find a volunteer at the nearest hall.
      </p>
    </div>
  );
}
