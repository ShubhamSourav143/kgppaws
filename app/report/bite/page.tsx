import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { BiteReportForm } from "@/components/report/BiteReportForm";

export const metadata: Metadata = {
  title: "Report a Dog Bite",
  description:
    "Report a dog bite incident on the IIT Kharagpur campus. Every report helps KGP PAWS identify repeated incidents and improve campus safety.",
  alternates: { canonical: "/report/bite" },
};

export default function BiteReportPage() {
  return (
    <div data-cursor="solo" className="container-page max-w-2xl py-8 sm:py-14">
      <header>
        <p className="eyebrow mb-3 text-terracotta-deep">Help / Report a Dog Bite</p>
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] text-forest-deep sm:text-5xl">
          Dog Bite Incident&nbsp;Report
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-moss">
          If you or someone you know has been bitten by a dog within the IIT
          Kharagpur campus, please report the incident using the form below.
          Your report helps KGP PAWS identify repeated bite incidents,
          coordinate with the institute authorities, and improve the safety of
          both the campus community and campus animals.
        </p>
      </header>

      <section
        aria-labelledby="bite-notice-h"
        className="mt-8 rounded-3xl border border-terracotta/25 bg-clay/50 p-6 shadow-soft sm:p-7"
      >
        <h2
          id="bite-notice-h"
          className="flex items-center gap-2.5 font-display text-xl font-bold text-terracotta-deep"
        >
          <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
          Important Notice
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-forest-deep">
          <p>
            If you have been bitten by a dog, please wash the wound thoroughly
            with soap and running water for at least 15 minutes and seek
            immediate medical attention at BC Roy Hospital or the nearest
            healthcare facility. Follow the advice of your doctor regarding
            anti-rabies vaccination and wound care.
          </p>
          <p>
            KGP PAWS actively conducts anti-rabies vaccination drives for campus
            dogs throughout the year and works continuously to improve the
            health and safety of both animals and the IIT Kharagpur community.
            Reporting every bite incident helps us identify repeated cases,
            monitor animal behaviour, and take timely action whenever necessary.
          </p>
        </div>
      </section>

      <BiteReportForm />
    </div>
  );
}
