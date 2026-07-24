"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * "Share Our Mission" button. Uses the native Web Share sheet where
 * available (mobile), and falls back to copying the link to the
 * clipboard with a transient confirmation.
 */
export function ShareButton({
  url = "https://kgp-paws.vercel.app/adopt",
  title = "Adopt, Don't Shop — KGP PAWS",
  text = "Every animal deserves a loving home. Meet the rescues of IIT Kharagpur waiting for a forever family.",
  className = "",
}: {
  url?: string;
  title?: string;
  text?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : url;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* user dismissed the share sheet — nothing to do */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className={
        "glass-dark inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-ivory transition-colors hover:bg-ivory/15 " +
        className
      }
    >
      {copied ? (
        <>
          <Check className="h-5 w-5 text-forest-bright" aria-hidden="true" />
          Link copied!
        </>
      ) : (
        <>
          <Share2 className="h-5 w-5 text-chakra-glow" aria-hidden="true" />
          Share Our Mission
        </>
      )}
    </button>
  );
}
