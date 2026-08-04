"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { AlertTriangle, Camera, FileText, Loader2, PawPrint, Siren, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/config";
import { uploadAll, type FileToUpload } from "@/lib/client/upload";
import { cn } from "@/lib/utils";

const MAX_FILE_MB = 8;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name").max(120),
  phone: z
    .string()
    .min(1, "We need a number to follow up on this report")
    .refine((v) => (v.match(/\d/g) ?? []).length >= 10, {
      error: "Enter a valid phone number with at least 10 digits",
    }),
  location: z
    .string()
    .min(3, "Where on campus did this happen?")
    .max(200),
  date: z
    .string()
    .min(1, "Pick the date of the incident")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00`);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return d <= today;
    }, { error: "The date of the incident can't be in the future" }),
  time: z.string().min(1, "Roughly what time did it happen?"),
  mapsLink: z.url({ error: "Paste a full link, starting with https://" }),
  description: z
    .string()
    .min(20, "A few sentences help us identify the dog and the situation")
    .max(2000),
});

type FormValues = z.infer<typeof schema>;

type Slot = "dogPhoto" | "wound" | "medical";

interface FileSpec {
  slot: Slot;
  label: string;
  note: string;
  accept: string;
  required: boolean;
  icon: typeof Camera;
  cta: string;
}

const FILES: FileSpec[] = [
  {
    slot: "dogPhoto",
    label: "Dog Photograph",
    note: "If available, and only if it was safe to take one. A clear photo helps us identify the exact dog.",
    accept: "image/*",
    required: false,
    icon: Camera,
    cta: "Add a photo of the dog",
  },
  {
    slot: "wound",
    label: "Bite / Wound Photograph",
    note: "A photo of the bite or wound. Shared only with the volunteer team reviewing this report.",
    accept: "image/*",
    required: true,
    icon: Camera,
    cta: "Add a photo of the bite or wound",
  },
  {
    slot: "medical",
    label: "BC Roy Hospital Medical Report",
    note: "A photo or PDF of your medical report or prescription from BC Roy Hospital.",
    accept: "image/*,application/pdf",
    required: true,
    icon: FileText,
    cta: "Add your medical report (image or PDF)",
  },
];

function fileError(file: File, accept: string): string | null {
  const pdfAllowed = accept.includes("application/pdf");
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !(pdfAllowed && isPdf)) {
    return pdfAllowed
      ? "Please choose an image or a PDF file."
      : "Please choose an image file.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return `Files up to ${MAX_FILE_MB} MB only.`;
  }
  return null;
}

function FileField({
  spec,
  file,
  error,
  onPick,
  onClear,
}: {
  spec: FileSpec;
  file: File | null;
  error?: string;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const Icon = spec.icon;

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-bold text-forest-deep">
        {spec.label}
        {spec.required ? (
          <span className="ml-0.5 text-terracotta">*</span>
        ) : (
          <span className="ml-1.5 font-normal text-moss">(if available)</span>
        )}
      </p>

      {file ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream px-4 py-3">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-forest-deep">
            <Icon className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
            <span className="truncate">{file.name}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              onClear();
              if (ref.current) ref.current.value = "";
            }}
            aria-label={`Remove ${spec.label}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-moss transition-colors hover:bg-mist"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-cream px-4 py-6 text-sm font-bold text-forest transition-colors hover:bg-mist",
            error
              ? "border-terracotta/60 hover:border-terracotta"
              : "border-forest/25 hover:border-forest/50"
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          {spec.cta}
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept={spec.accept}
        className="sr-only"
        aria-label={spec.label}
        onChange={(e) => onPick(e.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-xs font-semibold text-terracotta-deep">
          {error}
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-moss">{spec.note}</p>
      )}
    </div>
  );
}

export function BiteReportForm() {
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<Slot, File | null>>({
    dogPhoto: null,
    wound: null,
    medical: null,
  });
  const [fileErrors, setFileErrors] = useState<Partial<Record<Slot, string>>>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      phone: "",
      location: "",
      date: "",
      time: "",
      mapsLink: "",
      description: "",
    },
  });

  const pickFile = (spec: FileSpec, file: File | undefined) => {
    if (!file) return;
    const err = fileError(file, spec.accept);
    setFileErrors((prev) => ({ ...prev, [spec.slot]: err ?? undefined }));
    setFiles((prev) => ({ ...prev, [spec.slot]: err ? null : file }));
  };

  const clearFile = (slot: Slot) => {
    setFiles((prev) => ({ ...prev, [slot]: null }));
    setFileErrors((prev) => ({ ...prev, [slot]: undefined }));
  };

  /** Files are validated here; required ones block submission. */
  const validateFiles = () => {
    const next: Partial<Record<Slot, string>> = {};
    for (const spec of FILES) {
      if (spec.required && !files[spec.slot]) {
        next[spec.slot] = `${spec.label} is required`;
      }
    }
    setFileErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (v: FormValues) => {
    if (!validateFiles()) return;
    setSubmitError(null);
    setUploading(true);

    try {
      // One id ties the bytes on the CDN to the row in Supabase to the
      // row in the Sheet. Minted before any upload starts.
      const submissionId = crypto.randomUUID();

      const toUpload: FileToUpload[] = [
        files.dogPhoto ? { slot: "dogPhoto", file: files.dogPhoto } : null,
        files.wound ? { slot: "wound", file: files.wound } : null,
        files.medical ? { slot: "medical", file: files.medical } : null,
      ].filter((x): x is FileToUpload => x !== null);

      const attachments = await uploadAll("bite-reports", submissionId, toUpload);

      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: "bite",
          submissionId,
          data: {
            fullName: v.fullName,
            phone: v.phone,
            location: v.location,
            incidentDate: v.date,
            incidentTime: v.time,
            mapsLink: v.mapsLink,
            description: v.description,
          },
          attachments,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Submission failed" }));
        throw new Error(body?.error ?? "Submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while submitting. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-8 rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-10">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 13 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
        >
          <PawPrint className="h-7 w-7" aria-hidden="true" />
        </motion.span>

        <h2 className="mt-5 text-center font-display text-2xl font-bold text-forest-deep sm:text-3xl">
          Thank you for reporting this incident.
        </h2>

        <div className="mx-auto mt-4 max-w-xl space-y-4 text-sm leading-relaxed text-moss">
          <p>
            Your report has been received successfully and our volunteer team
            will review it as soon as possible.
          </p>
          <p>
            KGP PAWS actively vaccinates campus dogs and continuously monitors
            their health throughout the year. Every bite report helps us
            identify repeated incidents involving the same animal and improve
            campus safety.
          </p>
          <p>
            If multiple bite incidents are reported involving the same dog, or
            if the dog repeatedly displays aggressive behaviour, KGP PAWS will
            coordinate with the institute authorities to identify the animal,
            safely capture it when required, arrange veterinary examination,
            transport it for further evaluation and treatment, and, where
            appropriate, provide temporary shelter care while the case is
            assessed.
          </p>
          <p>
            Our objective is to protect both the IIT Kharagpur community and
            the welfare of campus animals through responsible, humane, and
            evidence-based action.
          </p>
          <p className="font-semibold text-forest-deep">
            Thank you for helping us build a safer campus for everyone.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <p className="mt-6 text-center text-xs italic text-moss/80">
            Demo mode: bite reports aren&apos;t sent anywhere yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 space-y-6 rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-8"
      aria-labelledby="bite-form-h"
    >
      <h2 id="bite-form-h" className="font-display text-2xl font-bold text-forest-deep">
        Bite Incident Report
      </h2>

      <Input
        label="Full Name"
        required
        autoComplete="name"
        placeholder="Your full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Input
        label="Phone Number"
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+91 98765 43210"
        hint="Used only by the volunteer team to follow up on this report."
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Input
        label="Location on IIT Kharagpur Campus"
        required
        placeholder="e.g. Nalanda Complex, near Gate 2"
        error={errors.location?.message}
        {...register("location")}
      />

      <div className="grid gap-6 sm:grid-cols-2">
        <Input
          label="Date of Incident"
          required
          type="date"
          error={errors.date?.message}
          {...register("date")}
        />
        <Input
          label="Approximate Time of Incident"
          required
          type="time"
          error={errors.time?.message}
          {...register("time")}
        />
      </div>

      <Input
        label="Google Maps Location Link"
        required
        type="url"
        inputMode="url"
        placeholder="https://maps.app.goo.gl/…"
        hint="Drop a pin at the spot in Google Maps, tap Share, and paste the link here."
        error={errors.mapsLink?.message}
        {...register("mapsLink")}
      />

      <div className="space-y-6 border-t border-line pt-6">
        {FILES.map((spec) => (
          <FileField
            key={spec.slot}
            spec={spec}
            file={files[spec.slot]}
            error={fileErrors[spec.slot]}
            onPick={(file) => pickFile(spec, file)}
            onClear={() => clearFile(spec.slot)}
          />
        ))}
      </div>

      <div className="border-t border-line pt-6">
        <Textarea
          label="Brief Description of the Incident"
          required
          rows={5}
          placeholder="What happened, what the dog looked like, whether it was provoked, and anything else that helps us identify it."
          error={errors.description?.message}
          {...register("description")}
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-terracotta/40 bg-clay/50 p-4 text-sm text-terracotta-deep"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="leading-relaxed">{submitError}</span>
        </div>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        className="w-full"
        disabled={isSubmitting || uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Uploading files…
          </>
        ) : (
          <>
            <Siren className="h-5 w-5" aria-hidden="true" />
            Submit Bite Report
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-relaxed text-moss">
        Your contact details, photographs and medical report are shared only
        with the KGP PAWS volunteer team and, where required, the institute
        authorities. They are never published.
      </p>
    </form>
  );
}
