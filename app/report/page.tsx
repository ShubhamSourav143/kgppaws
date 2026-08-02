import type { Metadata } from "next";
import Link from "next/link";
import { ReportForm } from "@/components/report/ReportForm";
import { TrackLookup } from "@/components/report/TrackLookup";

export const metadata: Metadata = {
  title: "Report an Animal",
  description:
    "See something? Help them faster. Report an injured or distressed animal at IIT Kharagpur in under 60 seconds.",
  alternates: { canonical: "/report" },
};

export default function ReportPage() {
  return (
    <div data-cursor="solo" className="container-page max-w-2xl py-8 sm:py-14">
      <header>
        <p className="eyebrow mb-3 text-terracotta-deep">Help / Report an Animal</p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] text-forest-deep sm:text-5xl">
          See Something? Help Them&nbsp;Faster.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-moss">
          Under sixty seconds, start to finish. Every field except the exact
          spot is optional.
        </p>
      </header>

      <ReportForm />

      <p className="mt-8 rounded-2xl border border-line bg-cream px-5 py-4 text-sm leading-relaxed text-moss">
        Bitten by a dog on campus?{" "}
        <Link
          href="/report/bite"
          className="font-bold text-terracotta-deep underline underline-offset-2"
        >
          File a dog bite incident report
        </Link>{" "}
        instead — it collects the medical details we need to follow up.
      </p>

      <div className="mt-10 border-t border-line pt-8">
        <TrackLookup />
      </div>
    </div>
  );
}
