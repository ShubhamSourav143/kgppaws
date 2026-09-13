"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Copy,
  HandHeart,
  HeartHandshake,
  Scissors,
  Siren,
  Smartphone,
  Soup,
  Stethoscope,
  Syringe,
  X,
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";

const PRESETS = [100, 300, 500, 1000, 2500];
const UPI_ID = "44070967397@sbi";
const HOLDER = "KGP PAWS";
const QR_SRC = "/images/donate/kgp-paws-qr.jpg";

const USES = [
  { icon: Soup, label: "Feeding" },
  { icon: Syringe, label: "Vaccination" },
  { icon: Scissors, label: "Sterilization" },
  { icon: Stethoscope, label: "Emergency medical treatment" },
  { icon: Siren, label: "Rescue operations" },
];

/**
 * A modal that opens whenever the URL hash becomes `#give`. Every "Donate"
 * link on the site points at `#give`, so wiring the modal to that hash means
 * each of those buttons surfaces the KGP PAWS UPI QR without changing them.
 *
 * The QR is a fixed image supplied by KGP PAWS (`public/images/donate/`).
 * Amount selection is used only for the PhonePe/GPay/UPI deep links: those
 * carry `am=<amount>` so the app opens with the amount pre-filled. Scanning
 * the QR itself is amount-free — the donor enters it in their bank app.
 */
export function DonateModal() {
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(300);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState(false);

  const effective = custom ? Math.max(0, Math.floor(Number(custom) || 0)) : amount;

  const close = useCallback(() => {
    setOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#give") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOpen(window.location.hash === "#give");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

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

  const amtParam = effective > 0 ? `&am=${effective}` : "";
  const commonParams = `pa=${UPI_ID}&pn=${encodeURIComponent(HOLDER)}${amtParam}&cu=INR&tn=${encodeURIComponent(
    "Donation to KGP PAWS"
  )}`;
  const upiUri = `upi://pay?${commonParams}`;
  const phonepeUri = `phonepe://pay?${commonParams}`;
  const gpayUri = `tez://upi/pay?${commonParams}`;

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
          data-lenis-prevent
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-h"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close donation panel"
            onClick={close}
            className="absolute inset-0 bg-night/70 backdrop-blur-sm"
          />

          <motion.div
            className="relative z-10 my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-cream shadow-[0_30px_80px_-20px_rgba(6,12,9,0.55)]"
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
                className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-ivory/80 transition-colors hover:bg-ivory/10 hover:text-ivory"
              >
                <X className="h-5 w-5" aria-hidden="true" />
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

            {/* QR image */}
            <div className="flex flex-col items-center px-6 pt-6 sm:px-7">
              <div className="rounded-2xl border border-line bg-ivory p-3 shadow-soft">
                <Image
                  src={QR_SRC}
                  alt="KGP PAWS UPI QR code — scan and pay"
                  width={220}
                  height={220}
                  className="h-[200px] w-[200px] rounded-lg object-contain sm:h-[220px] sm:w-[220px]"
                  priority
                  unoptimized
                />
              </div>
              <p className="mt-3 text-center text-xs leading-relaxed text-moss">
                Scan with any UPI app
                <br />
                <span className="text-moss/70">PhonePe · GPay · Paytm · BHIM</span>
              </p>
            </div>

            {/* UPI ID + amount */}
            <div className="space-y-5 px-6 pt-5 sm:px-7">
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

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-moss">
                  Choose an amount <span className="font-normal text-moss/70">(for app buttons below)</span>
                </p>
                {/* 3 columns on phones so each amount is a comfortable tap
                    target (5-across was ~51x32px); 5 across from sm up. */}
                <div
                  className="mt-2.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5"
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
                        "rounded-xl py-2.5 text-sm font-bold transition-colors",
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
            </div>

            {/* how donations are used */}
            <div className="mt-5 border-t border-line/70 bg-parchment/60 px-6 py-4 sm:px-7">
              <p className="text-[11px] font-bold uppercase tracking-wider text-moss">
                Your donation supports
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
                {USES.map((u) => (
                  <li
                    key={u.label}
                    className="inline-flex items-center gap-1.5 text-xs text-charcoal/80"
                  >
                    <u.icon className="h-3.5 w-3.5 text-saffron-deep" aria-hidden="true" />
                    {u.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* pay buttons */}
            <div className="space-y-3 border-t border-line/70 bg-parchment px-6 py-4 sm:px-7">
              <p className="flex items-center gap-2 text-xs text-moss">
                <HeartHandshake className="h-4 w-4 text-terracotta" aria-hidden="true" />
                Paying{" "}
                <span className="font-bold text-forest-deep">
                  {effective > 0 ? formatINR(effective) : "—"}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <a
                  href={phonepeUri}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#5f259f] px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:brightness-110 active:scale-95",
                    effective <= 0 && "pointer-events-none opacity-60"
                  )}
                  aria-label={`Pay ${effective > 0 ? formatINR(effective) : "with"} using PhonePe`}
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  PhonePe
                </a>
                <a
                  href={gpayUri}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:brightness-110 active:scale-95",
                    effective <= 0 && "pointer-events-none opacity-60"
                  )}
                  aria-label={`Pay ${effective > 0 ? formatINR(effective) : "with"} using Google Pay`}
                >
                  <Smartphone className="h-4 w-4" aria-hidden="true" />
                  Google Pay
                </a>
                <a
                  href={upiUri}
                  className={cn(
                    "col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-saffron-deep via-saffron to-marigold px-4 py-2.5 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95 sm:col-span-1",
                    effective <= 0 && "pointer-events-none opacity-60"
                  )}
                  aria-label={`Pay ${effective > 0 ? formatINR(effective) : "with"} using any UPI app`}
                >
                  <HandHeart className="h-4 w-4" aria-hidden="true" />
                  Any UPI app
                </a>
              </div>
              <p className="text-[11px] leading-relaxed text-moss/80">
                App buttons work on your phone — they open the selected app with the amount pre-filled.
                On desktop, scan the QR above with your phone.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
