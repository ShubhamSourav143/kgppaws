"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  LocateFixed,
  PawPrint,
  Siren,
  X,
} from "lucide-react";
import { Input, Select, Textarea, FieldWrap } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { CAMPUS_ZONES } from "@/lib/demo/zones";
import { PROBLEM_LABELS, SEVERITY_LABELS } from "@/lib/demo/reports";
import { nextReportId, saveLocalReport } from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ReportProblem, ReportSeverity, Species } from "@/types";

const MAX_PHOTO_MB = 8;

const schema = z.object({
  animalType: z.enum(["dog", "cat", "other"]),
  problem: z.enum([
    "injured", "sick", "unable_to_walk", "bleeding",
    "vehicle_accident", "distressed", "puppies_kittens_at_risk", "other",
  ], { error: "Please pick the closest match" }),
  severity: z.enum(["emergency", "urgent", "moderate", "low"]),
  zoneId: z.string().min(1, "Pick the nearest landmark"),
  locationNote: z.string().max(200),
  description: z.string().min(10, "One short line helps volunteers find them"),
  contact: z.string(),
});

type FormValues = z.infer<typeof schema>;

function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  error,
  tone = "forest",
}: {
  legend: string;
  options: { id: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  error?: string;
  tone?: "forest" | "terracotta";
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold text-forest-deep">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              "min-h-11 rounded-full px-4 py-2 text-sm font-bold transition-colors",
              value === o.id
                ? tone === "terracotta"
                  ? "bg-terracotta text-parchment"
                  : "bg-forest text-cream"
                : "border border-forest/20 text-forest hover:bg-mist"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-semibold text-terracotta-deep">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function ReportForm() {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [geo, setGeo] = useState<"idle" | "asking" | "captured" | "denied">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      animalType: "dog",
      severity: "urgent",
      zoneId: "",
      locationNote: "",
      contact: "",
    },
  });

  const animalType = watch("animalType");
  const problem = watch("problem");
  const severity = watch("severity");

  const onPhoto = (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setPhotoError(`Images up to ${MAX_PHOTO_MB} MB only.`);
      return;
    }
    setPhotoName(file.name);
  };

  const captureLocation = () => {
    if (!("geolocation" in navigator)) return;
    setGeo("asking");
    navigator.geolocation.getCurrentPosition(
      () => setGeo("captured"),
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onSubmit = (v: FormValues) => {
    const id = nextReportId();
    const now = new Date().toISOString();
    saveLocalReport({
      id,
      createdAt: now,
      animalType: v.animalType as Species,
      problem: v.problem as ReportProblem,
      severity: v.severity as ReportSeverity,
      zoneId: v.zoneId,
      locationNote: v.locationNote,
      description: v.description,
      status: "reported",
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
    setSubmittedId(id);
  };

  if (submittedId) {
    return (
      <div className="mt-10 flex flex-col items-center rounded-3xl border border-line bg-parchment p-8 text-center shadow-soft sm:p-12">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 13 }}
          className="grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
        >
          <PawPrint className="h-7 w-7" aria-hidden="true" />
        </motion.span>
        <h2 className="mt-5 font-display text-3xl font-bold text-forest-deep">
          Report received.
        </h2>
        <p className="mt-2 max-w-md text-moss">
          Volunteers monitor incoming reports and will assess as quickly as
          they can. Keep this ID to track progress:
        </p>
        <p className="mt-4 rounded-full border border-line bg-cream px-5 py-2 font-mono text-sm font-bold text-forest">
          {submittedId}
        </p>
        {!isSupabaseConfigured && (
          <p className="mt-3 max-w-sm text-xs italic text-moss/80">
            Demo mode: reports are stored in your browser and volunteer
            dispatch is not live.
          </p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/report/${submittedId}`} size="lg">
            Track this report
          </ButtonLink>
          <Button variant="outline" size="lg" onClick={() => setSubmittedId(null)}>
            Report another animal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-7">
      {/* photo */}
      <div>
        <p className="mb-2 text-sm font-bold text-forest-deep">
          Photo <span className="font-normal text-moss">(if safe to take one)</span>
        </p>
        {photoName ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-parchment px-4 py-3">
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
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-forest/25 bg-parchment px-4 py-6 text-sm font-bold text-forest transition-colors hover:border-forest/50 hover:bg-mist"
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

      <ChipGroup
        legend="Animal"
        value={animalType}
        onChange={(v) => setValue("animalType", v, { shouldValidate: true })}
        options={[
          { id: "dog", label: "Dog" },
          { id: "cat", label: "Cat" },
          { id: "other", label: "Other" },
        ]}
      />

      <ChipGroup
        legend="What's wrong?"
        value={problem}
        error={errors.problem?.message}
        onChange={(v) => setValue("problem", v, { shouldValidate: true })}
        options={(Object.keys(PROBLEM_LABELS) as (keyof typeof PROBLEM_LABELS)[]).map(
          (k) => ({ id: k, label: PROBLEM_LABELS[k] })
        )}
      />

      <ChipGroup
        legend="How urgent does it look?"
        tone="terracotta"
        value={severity}
        onChange={(v) => setValue("severity", v, { shouldValidate: true })}
        options={(Object.keys(SEVERITY_LABELS) as (keyof typeof SEVERITY_LABELS)[]).map(
          (k) => ({ id: k, label: SEVERITY_LABELS[k] })
        )}
      />

      {/* location */}
      <div className="space-y-4 rounded-3xl border border-line bg-parchment p-5">
        <Select
          label="Nearest campus landmark"
          required
          error={errors.zoneId?.message}
          {...register("zoneId")}
        >
          <option value="">Select a landmark…</option>
          {CAMPUS_ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name}
            </option>
          ))}
        </Select>
        <Input
          label="Exact spot (optional)"
          placeholder="e.g. behind the tea stalls, near the cycle stand"
          error={errors.locationNote?.message}
          {...register("locationNote")}
        />
        <button
          type="button"
          onClick={captureLocation}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors",
            geo === "captured"
              ? "border-forest bg-mist text-forest"
              : "border-forest/25 text-forest hover:bg-mist"
          )}
        >
          {geo === "captured" ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
          )}
          {geo === "captured"
            ? "Location attached"
            : geo === "asking"
              ? "Requesting permission…"
              : geo === "denied"
                ? "Location unavailable — landmark is enough"
                : "Attach my device location"}
        </button>
        <p className="text-xs leading-relaxed text-moss">
          Precise coordinates are shared only with the responding volunteers,
          never shown publicly.
        </p>
      </div>

      <Textarea
        label="What happened?"
        required
        rows={3}
        placeholder="e.g. Brown dog limping badly on the back leg, won't let anyone near"
        error={errors.description?.message}
        {...register("description")}
      />

      <FieldWrap
        label="Your phone or email (optional)"
        htmlFor="report-contact"
        hint="Only used if volunteers need to ask a follow-up. Never public."
      >
        <input
          id="report-contact"
          className="w-full rounded-xl border border-line bg-parchment px-4 py-3 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
          placeholder="+91… or you@example.com"
          {...register("contact")}
        />
      </FieldWrap>

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={isSubmitting}>
        <Siren className="h-5 w-5" aria-hidden="true" />
        Submit report
      </Button>
      <p className="text-center text-xs leading-relaxed text-moss">
        Reports go to the volunteer response queue. For life-threatening
        emergencies, also alert any volunteer or security staff nearby.
      </p>
    </form>
  );
}
