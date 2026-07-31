"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, MapPin, PawPrint, Siren, X } from "lucide-react";
import { Textarea, FieldWrap } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { nextReportId, saveLocalReport } from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";

const MAX_PHOTO_MB = 8;

const schema = z.object({
  address: z.string().min(4, "Please share the location address."),
  mapsLink: z
    .string()
    .min(1, "A Google Maps link helps our team find the animal.")
    .url("Please paste the full Google Maps link (starts with https://)."),
  symptoms: z
    .string()
    .min(6, "Please describe what you see — even one line helps."),
});

type FormValues = z.infer<typeof schema>;

/**
 * Floating "Report an Animal" button — pinned to the corner of every page
 * (except its own /report route, which already hosts a full form). Tapping
 * it opens a compact modal that takes only what a first responder needs to
 * act: a photo, where the animal is, and what looks wrong.
 *
 * The full report form on /report is unchanged — it still collects animal
 * type, problem type, severity, campus zone and optional device location.
 * This is the fast lane for people who spot an animal in distress while
 * moving around the site.
 */
export function FloatingReportButton() {
  const reduced = useReducedMotion() ?? false;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const close = useCallback(() => {
    setOpen(false);
  }, []);

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

  const onPhoto = (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`Please choose an image under ${MAX_PHOTO_MB} MB.`);
      return;
    }
    setPhotoName(file.name);
  };

  const onSubmit = (v: FormValues) => {
    const id = nextReportId();
    const now = new Date().toISOString();
    saveLocalReport({
      id,
      createdAt: now,
      animalType: "dog",
      problem: "other",
      severity: "urgent",
      zoneId: "",
      locationNote: v.address,
      description: v.symptoms,
      status: "reported",
      mapsLink: v.mapsLink,
      photoName: photoName ?? undefined,
      updates: [
        {
          id: `u-${Date.now()}`,
          date: now,
          status: "reported",
          note: "Report received. Thank you for helping.",
        },
      ],
      demo: true,
    });

    fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: "report",
        data: {
          id,
          timestamp: now,
          animal: "dog",
          problem: "other",
          severity: "urgent",
          location: v.address,
          description: v.symptoms,
          mapsLink: v.mapsLink || "",
          contact: "",
        },
      }),
    }).catch(() => {});

    setSubmittedId(id);
    reset();
    setPhotoName(null);
  };

  const resetForNext = () => {
    setSubmittedId(null);
    setOpen(false);
  };

  // Do not show the floating button on the /report route itself — it
  // already renders a full-page report form, so the floating trigger
  // would be redundant and could hide part of the form on mobile.
  if (pathname.startsWith("/report")) return null;

  return (
    <>
      {/* floating trigger — visible on every page. Positioned above the mobile
          bottom-dock so it never overlaps that nav on small screens. */}
      <button
        type="button"
        aria-label="Report an animal"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-r from-saffron-deep to-saffron text-ivory shadow-ember transition-transform hover:scale-[1.04] active:scale-95 sm:right-6",
          // above the mobile dock (~4rem tall + safe area) on small screens;
          // sits at a comfy bottom-corner on desktop
          "bottom-24 md:bottom-6"
        )}
      >
        <Siren className="h-6 w-6" aria-hidden="true" />
        <span className="sr-only">Report an animal</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="report-modal"
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-h"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* backdrop */}
            <button
              type="button"
              aria-label="Close report form"
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
              <div className="relative bg-gradient-to-br from-saffron-deep to-saffron px-6 py-5 text-ivory sm:px-7">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-ivory/80 transition-colors hover:bg-ivory/10 hover:text-ivory"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <p className="eyebrow inline-flex items-center gap-1.5 text-ivory/85">
                  <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                  Report an animal
                </p>
                <h2
                  id="report-modal-h"
                  className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl"
                >
                  Tell us where and what you see.
                </h2>
              </div>

              {submittedId ? (
                <div className="flex flex-col items-center px-6 py-10 text-center sm:px-8">
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 13 }}
                    className="grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
                  >
                    <PawPrint className="h-7 w-7" aria-hidden="true" />
                  </motion.span>
                  <h3 className="mt-5 font-display text-2xl font-bold text-forest-deep">
                    Thank you for reporting.
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-moss">
                    The KGP PAWS rescue team will review your report as soon as
                    possible.
                  </p>
                  <p className="mt-4 rounded-full border border-line bg-parchment px-4 py-1.5 font-mono text-xs font-bold text-forest">
                    {submittedId}
                  </p>
                  {!isSupabaseConfigured && (
                    <p className="mt-2 text-xs italic text-moss/80">
                      Demo mode: reports are stored in your browser only.
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button variant="outline" onClick={resetForNext}>
                      Close
                    </Button>
                    <Button onClick={() => setSubmittedId(null)}>
                      Report another animal
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 sm:p-7">
                  {/* photo */}
                  <div>
                    <p className="mb-2 text-sm font-bold text-forest-deep">
                      Photo <span className="font-normal text-moss">(if safe to take one)</span>
                    </p>
                    {photoName ? (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-ivory px-4 py-3">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-forest-deep">
                          <Camera className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
                          {photoName}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoName(null);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                          aria-label="Remove photo"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-moss hover:bg-mist"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest/25 bg-ivory px-4 py-4 text-sm font-bold text-forest transition-colors hover:border-forest/50 hover:bg-mist"
                      >
                        <Camera className="h-5 w-5" aria-hidden="true" />
                        Add or capture a photo
                      </button>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      aria-label="Upload a photo of the animal"
                      onChange={(e) => onPhoto(e.target.files?.[0])}
                    />
                    {photoError && (
                      <p role="alert" className="mt-1.5 text-xs font-semibold text-terracotta-deep">
                        {photoError}
                      </p>
                    )}
                  </div>

                  <Textarea
                    label="Location address"
                    required
                    rows={2}
                    placeholder="Landmark, hall, gate or street where the animal is"
                    error={errors.address?.message}
                    {...register("address")}
                  />

                  <FieldWrap
                    label="Google Maps location link"
                    htmlFor="report-maps"
                    required
                    hint="Open Google Maps at the spot, tap Share, choose Copy link."
                    error={errors.mapsLink?.message}
                  >
                    <div className="relative">
                      <MapPin
                        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss"
                        aria-hidden="true"
                      />
                      <input
                        id="report-maps"
                        type="url"
                        required
                        inputMode="url"
                        placeholder="https://maps.app.goo.gl/…"
                        className="w-full rounded-xl border border-line bg-ivory py-3 pl-11 pr-4 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                        {...register("mapsLink")}
                      />
                    </div>
                  </FieldWrap>

                  <Textarea
                    label="Symptoms"
                    required
                    rows={3}
                    placeholder="e.g. Brown dog limping badly on back leg, will not let anyone near"
                    error={errors.symptoms?.message}
                    {...register("symptoms")}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <p className="text-xs text-moss">
                      Shared only with the responding volunteers.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" type="button" onClick={close}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="accent"
                        disabled={isSubmitting}
                      >
                        <Siren className="h-4 w-4" aria-hidden="true" />
                        Submit report
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
