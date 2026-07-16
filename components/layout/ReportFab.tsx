"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Siren } from "lucide-react";

/**
 * Persistent one-thumb "Report an Animal" action on mobile.
 * Hidden on the report flow itself and inside dashboards.
 */
export function ReportFab() {
  const pathname = usePathname();
  if (
    pathname.startsWith("/report") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }
  return (
    <Link
      href="/report"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-terracotta px-5 py-3.5 font-bold text-parchment shadow-lift transition-transform active:scale-95 md:hidden"
      aria-label="Report an animal in need"
    >
      <Siren className="h-5 w-5" aria-hidden="true" />
      Report
    </Link>
  );
}
