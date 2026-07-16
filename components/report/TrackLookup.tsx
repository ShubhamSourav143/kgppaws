"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function TrackLookup() {
  const [id, setId] = useState("");
  const router = useRouter();

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-forest-deep">
        Already reported? Track it.
      </h2>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const clean = id.trim().toUpperCase();
          if (clean) router.push(`/report/${encodeURIComponent(clean)}`);
        }}
      >
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="PAWS-RESCUE-2026-00124"
          aria-label="Report ID"
          className="min-w-0 flex-1 rounded-full border border-line bg-parchment px-5 py-3 font-mono text-sm placeholder:text-moss/50 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream transition-colors hover:bg-forest-deep"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Track
        </button>
      </form>
      <p className="mt-2 text-xs text-moss">
        Try the demo report ID above to see a live status timeline.
      </p>
    </div>
  );
}
