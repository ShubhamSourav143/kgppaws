"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";

/**
 * Route-level error boundary.
 *
 * The app had no error.tsx and no global-error.tsx, so any throw during a
 * server render — a Supabase outage mid-query, a bad CMS row, a null deref in
 * a mapper — dropped the visitor onto Next's unstyled default 500 page, with
 * no branding, no way back, and no route to report an animal. For a site whose
 * primary job is to receive emergency rescue reports, the recovery path
 * matters more than the apology.
 *
 * Deliberately not a redesign: this reuses the same tokens (parchment, forest,
 * saffron, font-display) as app/not-found.tsx.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side digest only; the message itself is not rendered to the user.
    console.error("[app/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-parchment p-8 text-center shadow-soft sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-mist text-terracotta">
          <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        </span>

        <h1 className="mt-5 font-display text-3xl font-bold text-forest-deep">
          Something went wrong on our side.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-moss">
          This page failed to load. Nothing you did caused it, and nothing you
          submitted has been lost. Trying again usually works.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-6 py-3 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-forest/20 bg-ivory/60 px-6 py-3 text-sm font-semibold text-forest transition-colors hover:bg-ivory"
          >
            Go to the homepage
          </Link>
        </div>

        {/* An animal in trouble must never be blocked by a broken page. */}
        <p className="mt-6 text-xs text-moss">
          Need to report an animal urgently?{" "}
          <Link href="/report" className="font-bold text-forest underline underline-offset-2">
            Open the report form
          </Link>
          .
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-moss/70">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
