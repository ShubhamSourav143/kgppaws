"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandHeart, Info, PawPrint, Repeat } from "lucide-react";
import { QrCodeImage } from "@/components/qr/QrCode";
import { PawMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { saveLocalDonation } from "@/lib/local-store";
import { isPaymentConfigured } from "@/lib/config";
import { formatINR, cn } from "@/lib/utils";
import type { DonationCampaign } from "@/types";

const PRESETS = [100, 300, 500, 1000];

/**
 * Donation panel — Indian payment workflow architecture.
 *
 * Live mode: creates a payment order server-side (Razorpay/UPI intent) and
 * marks a donation successful ONLY after gateway webhook verification
 * (see /supabase schema + README payment integration).
 *
 * Demo mode: no gateway is configured, so no payment is taken and nothing
 * is ever displayed as "successful". We record a clearly-labelled intent
 * and show the gratitude-card preview.
 */
export function DonatePanel({ campaigns }: { campaigns: DonationCampaign[] }) {
  const [campaignSlug, setCampaignSlug] = useState(campaigns[0]?.slug ?? "");
  const [amount, setAmount] = useState<number>(300);
  const [custom, setCustom] = useState("");
  const [monthly, setMonthly] = useState(false);
  const [stage, setStage] = useState<"form" | "intent">("form");

  const campaign = campaigns.find((c) => c.slug === campaignSlug);
  const effective = custom ? Number(custom) || 0 : amount;
  const upiUri = `upi://pay?pa=kgppaws@upi&pn=KGP%20PAWS&am=${effective}&cu=INR&tn=${encodeURIComponent(
    campaign?.title ?? "Donation"
  )}`;

  const proceed = () => {
    if (!campaign || effective < 10) return;
    saveLocalDonation({
      id: `DON-${Date.now().toString(36).toUpperCase()}`,
      campaignSlug: campaign.slug,
      campaignTitle: campaign.title,
      amount: effective,
      createdAt: new Date().toISOString(),
      status: "pending_verification",
    });
    setStage("intent");
  };

  if (stage === "intent" && campaign) {
    return (
      <section
        aria-labelledby="gratitude-h"
        className="rounded-3xl border border-line bg-parchment p-6 shadow-soft"
      >
        {/* gratitude card */}
        <motion.div
          initial={{ rotate: -2, y: 12, opacity: 0 }}
          animate={{ rotate: 0, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="grain overflow-hidden rounded-2xl bg-forest p-6 text-center text-cream"
        >
          <PawMark className="mx-auto h-9 w-9 text-sand" />
          <h2 id="gratitude-h" className="mt-3 font-display text-2xl font-bold">
            Thank you, from every paw.
          </h2>
          <p className="mt-2 text-sm text-sand">
            {formatINR(effective)} pledged to “{campaign.title}”
          </p>
          <p className="mt-3 text-[11px] text-cream/60">
            kgppaws.org · IIT Kharagpur
          </p>
        </motion.div>

        <div className="mt-5 space-y-3 text-sm leading-relaxed text-charcoal/85">
          {isPaymentConfigured ? (
            <p>
              Complete the payment in your UPI app. Your donation appears in
              your history once the gateway confirms it.
            </p>
          ) : (
            <>
              <p className="flex items-start gap-2 rounded-2xl bg-sand-light p-3 text-forest-deep">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Demo mode:</strong> payments are disabled and no
                  money moves. In production this step opens PhonePe, Google
                  Pay or any UPI app, and the donation is confirmed only after
                  gateway verification.
                </span>
              </p>
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-forest/25 p-4">
                <QrCodeImage value={upiUri} size={160} className="opacity-60" />
              </div>
              <p className="text-center text-xs text-moss">
                Sample UPI intent QR (non-functional in demo).
              </p>
            </>
          )}
        </div>

        <Button
          variant="outline"
          className="mt-5 w-full"
          onClick={() => setStage("form")}
        >
          Make another pledge
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="donate-panel-h"
      className="rounded-3xl border border-line bg-parchment p-6 shadow-soft"
    >
      <h2
        id="donate-panel-h"
        className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
      >
        <HandHeart className="h-6 w-6 text-terracotta" aria-hidden="true" />
        Support a Paw
      </h2>

      {/* campaign picker */}
      <label htmlFor="donate-campaign" className="mt-5 block text-sm font-bold text-forest-deep">
        Campaign
      </label>
      <select
        id="donate-campaign"
        value={campaignSlug}
        onChange={(e) => setCampaignSlug(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
      >
        {campaigns.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.title}
          </option>
        ))}
      </select>

      {/* amounts */}
      <p className="mt-5 text-sm font-bold text-forest-deep">Amount</p>
      <div className="mt-2 grid grid-cols-4 gap-2" role="group" aria-label="Donation amount">
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
                : "border border-line text-forest hover:bg-mist"
            )}
          >
            ₹{p}
          </button>
        ))}
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={10}
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        placeholder="Custom amount (₹)"
        aria-label="Custom donation amount in rupees"
        className="mt-2 w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
      />

      {/* frequency */}
      <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Donation frequency">
        <button
          type="button"
          onClick={() => setMonthly(false)}
          aria-pressed={!monthly}
          className={cn(
            "rounded-xl py-2.5 text-sm font-bold transition-colors",
            !monthly ? "bg-forest text-cream" : "border border-line text-forest hover:bg-mist"
          )}
        >
          One-time
        </button>
        <button
          type="button"
          onClick={() => setMonthly(true)}
          aria-pressed={monthly}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-colors",
            monthly ? "bg-forest text-cream" : "border border-line text-forest hover:bg-mist"
          )}
        >
          <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
          Monthly
        </button>
      </div>
      <AnimatePresence>
        {monthly && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden text-xs leading-relaxed text-moss"
          >
            Monthly support uses the payment provider&apos;s recurring mandate
            (UPI Autopay) when configured. You can cancel anytime.
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        variant="accent"
        size="lg"
        className="mt-6 w-full"
        disabled={effective < 10}
        onClick={proceed}
      >
        <PawPrint className="h-4 w-4" aria-hidden="true" />
        Continue with {effective >= 10 ? formatINR(effective) : "…"}
        {monthly ? " / month" : ""}
      </Button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-moss">
        UPI · PhonePe · Google Pay · cards via gateway. Donations are
        confirmed only after payment verification.
      </p>
    </section>
  );
}
