"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, HandHeart, HeartHandshake, X } from "lucide-react";
import { QrCodeImage } from "@/components/qr/QrCode";
import { cn, formatINR } from "@/lib/utils";

const PRESETS = [100, 300, 500, 1000, 2500];
const UPI_ID = "kgppaws@upi";
const HOLDER = "KGP PAWS";

/**
 * A modal that opens whenever the URL hash becomes `#give`. Every existing
 * "Donate Now" / "Donate to this" link on the site points at `#give`, so
 * wiring the modal to that hash means each of those buttons now surfaces
 * the UPI QR without changing a single Link.
 *
 * The modal builds a live `upi://pay?...` intent URI from the chosen amount
 * and encodes it as a QR the user scans in any UPI app. The UPI ID is also
 * shown in plain text with a copy button, so desktop users can paste it
 * into their bank app manually.
 */
export function DonateModal() {
  const reduced = useReducedMotion() ?? false;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(300);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);

  const effective = custom ? Math.max(0, Math.floor(Number(custom) || 0)) : amount;

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#give") {
      // strip the hash without adding a history entry
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Watch hash for #give. Listens both on mount (deep link / same-page click
  // that landed on #give before we mounted) and on subsequent hashchange
  // events (all the existing <Link href="#give"> buttons fire hashchange).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOpen(window.location.hash === "#give");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  // Escape closes; body-scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const upiUri = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    HOLDER
  )}&am=${effective}&cu=INR&tn=${encodeURIComponent("Donation to KGP PAWS")}`;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no-op — fall back to the visible text */
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="donate-modal"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-h"
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close donation panel"
            onClick={close}
            className="absolute inset-0 bg-night/70 backdrop-blur-sm"
          />

          {/* dialog */}
          <motion.div
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-cream shadow-[0_30px_80px_-20px_rgba(6,12,9,0.55)]"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* header band */}
            <div className="relative bg-gradient-to-br from-forest-deep to-forest px-6 py-5 text-ivory sm:px-7">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ivory/80 transition-colors hover:bg-ivory/10 hover:text-ivory"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="eyebrow inline-flex items-center gap-1.5 text-marigold">
                <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
                Donate via UPI
              </p>
              <h2
                id="donate-modal-h"
                className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl"
              >
                Every rupee reaches a paw.
              </h2>
            </div>

            {/* body */}
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:gap-7 sm:p-7">
              {/* left — amount + UPI id */}
              <div className="min-w-0 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-moss">
                    Choose an amount
                  </p>
                  <div
                    className="mt-2.5 grid grid-cols-3 gap-2"
                    role="group"
                    aria-label="Donation amount"
                  >
                    {PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setAmount(p);
                          setCustom("");
                        }}
                        aria-pressed={!custom && amount === p}
                        className={cn(
                          "rounded-xl py-2 text-sm font-bold transition-colors",
                          !custom && amount === p
                            ? "bg-forest text-cream"
                            : "border border-line bg-ivory text-forest hover:bg-mist"
                        )}
                      >
                        ₹{p}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    placeholder="Custom amount (₹)"
                    aria-label="Custom donation amount in rupees"
                    className="mt-2 w-full rounded-xl border border-line bg-ivory px-4 py-2.5 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-moss">
                    UPI ID
                  </p>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-ivory px-3 py-2.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-forest-deep">
                      {UPI_ID}
                    </code>
                    <button
                      type="button"
                      onClick={copyId}
                      aria-label={copied ? "UPI ID copied" : "Copy UPI ID"}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors",
                        copied
                          ? "bg-forest-bright/15 text-forest-bright"
                          : "bg-mist text-forest hover:bg-sand"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-moss">
                    Payable to <span className="font-bold text-forest-deep">{HOLDER}</span>
                  </p>
                </div>
              </div>

              {/* right — QR code */}
              <div className="flex flex-col items-center justify-start sm:pt-6">
                <div className="rounded-2xl border border-line bg-ivory p-3 shadow-soft">
                  <QrCodeImage value={upiUri} size={168} />
                </div>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-moss">
                  Scan with any UPI app
                  <br />
                  <span className="text-moss/70">PhonePe · GPay · Paytm · BHIM</span>
                </p>
              </div>
            </div>

            {/* footer strip */}
            <div className="flex flex-col gap-3 border-t border-line/70 bg-parchment px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="flex items-center gap-2 text-xs text-moss">
                <HeartHandshake className="h-4 w-4 text-terracotta" aria-hidden="true" />
                Paying{" "}
                <span className="font-bold text-forest-deep">
                  {effective > 0 ? formatINR(effective) : "—"}
                </span>
              </p>
              <a
                href={upiUri}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-5 py-2.5 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95",
                  effective <= 0 && "pointer-events-none opacity-60"
                )}
              >
                <HandHeart className="h-4 w-4" aria-hidden="true" />
                Open UPI app
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
