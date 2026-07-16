"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // user cancelled the share sheet — nothing to do
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-forest/25 px-5 py-2.5 text-sm font-bold text-forest transition-colors hover:bg-mist"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share profile
        </>
      )}
    </button>
  );
}
