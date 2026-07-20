"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, PawPrint } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  nextApplicationId,
  saveLocalApplication,
} from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types";

const schema = z.object({
  // step 1 — about you
  name: z.string().min(2, "Please tell us your name"),
  email: z.email("A valid email helps us reach you"),
  phone: z.string().min(8, "A valid phone number is required"),
  affiliation: z.string().min(1, "Please select one"),
  // step 2 — living situation
  housing: z.string().min(1, "Please select one"),
  ownOrRent: z.string().min(1, "Please select one"),
  householdAgrees: z.boolean().refine((v) => v, {
    message: "Everyone at home should be on board before an animal moves in",
  }),
  hasOutdoorSpace: z.boolean(),
  // step 3 — experience
  hadPetsBefore: z.boolean(),
  currentPets: z.string(),
  hoursAloneDaily: z.string().min(1, "Please select one"),
  // step 4 — motivation
  motivation: z
    .string()
    .min(30, "A few honest sentences help us make the right match"),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: (keyof FormValues)[][] = [
  ["name", "email", "phone", "affiliation"],
  ["housing", "ownOrRent", "householdAgrees", "hasOutdoorSpace"],
  ["hadPetsBefore", "currentPets", "hoursAloneDaily"],
  ["motivation"],
  [], // review
];

const STEP_TITLES = [
  "About you",
  "Living situation",
  "Animal experience",
  `Why this animal?`,
  "Review",
];

export function ApplyFlow({ animal }: { animal: Animal }) {
  const [step, setStep] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      householdAgrees: false,
      hasOutdoorSpace: false,
      hadPetsBefore: false,
      currentPets: "",
    },
    mode: "onTouched",
  });

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const onSubmit = (values: FormValues) => {
    const id = nextApplicationId();
    saveLocalApplication({
      id,
      animalSlug: animal.slug,
      createdAt: new Date().toISOString(),
      status: "submitted",
      applicant: {
        name: values.name,
        email: values.email,
        phone: values.phone,
        affiliation: values.affiliation,
      },
      living: {
        housing: values.housing,
        ownOrRent: values.ownOrRent,
        householdAgrees: values.householdAgrees,
        hasOutdoorSpace: values.hasOutdoorSpace,
      },
      experience: {
        hadPetsBefore: values.hadPetsBefore,
        currentPets: values.currentPets,
        hoursAloneDaily: values.hoursAloneDaily,
      },
      motivation: values.motivation,
      demo: true,
    });
    setSubmittedId(id);
  };

  /* —— submitted state —— */
  if (submittedId) {
    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-forest text-cream"
        >
          <PawPrint className="h-9 w-9" aria-hidden="true" />
        </motion.div>
        <h1 className="mt-6 max-w-lg text-balance font-display text-4xl font-bold text-forest-deep">
          Application submitted. {animal.name} thanks you already.
        </h1>
        <p className="mt-3 max-w-md text-moss">
          Our adoption team reviews every application personally. You can track
          the status from your dashboard.
        </p>
        <p className="mt-5 rounded-full border border-line bg-parchment px-5 py-2 font-mono text-sm font-bold text-forest">
          {submittedId}
        </p>
        {!isSupabaseConfigured && (
          <p className="mt-3 max-w-sm text-xs italic text-moss/80">
            Demo mode: this application is stored in your browser only.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/dashboard" size="lg">
            Track my application
          </ButtonLink>
          <ButtonLink href={`/animal/${animal.slug}`} variant="outline" size="lg">
            Back to {animal.name}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const values = getValues();

  return (
    <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_2fr]">
      {/* sticky animal summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Link
          href={`/animal/${animal.slug}`}
          className="flex items-center gap-4 rounded-3xl border border-line bg-parchment p-4 shadow-soft transition-colors hover:border-forest/30 lg:flex-col lg:items-stretch lg:p-6"
        >
          <AnimalPortrait
            animal={animal}
            className="h-20 w-20 shrink-0 lg:h-auto lg:w-full lg:!aspect-square"
          />
          <div className="lg:mt-4">
            <p className="eyebrow text-[10px] text-terracotta-deep">
              Adoption inquiry
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-forest-deep">
              {animal.name}
            </p>
            <p className="mt-1 text-sm italic text-moss">“{animal.tagline}”</p>
          </div>
        </Link>
      </aside>

      <div>
        {/* progress */}
        <nav aria-label="Application progress" className="mb-8">
          <ol className="flex items-center gap-1.5">
            {STEP_TITLES.map((title, i) => (
              <li key={title} className="flex flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-colors duration-300",
                    i <= step ? "bg-terracotta" : "bg-sand-light"
                  )}
                />
                <span
                  className={cn(
                    "hidden text-[10px] font-bold uppercase tracking-wider sm:block",
                    i === step ? "text-terracotta-deep" : "text-moss/60"
                  )}
                >
                  {title}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="font-display text-3xl font-bold text-forest-deep sm:text-4xl">
          {step === 3 ? `Why ${animal.name}?` : STEP_TITLES[step]}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <Input label="Full name" required placeholder="Your name" error={errors.name?.message} {...register("name")} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input label="Email" type="email" required placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
                    <Input label="Phone" type="tel" required placeholder="+91…" error={errors.phone?.message} {...register("phone")} />
                  </div>
                  <Select label="Your connection to IIT Kharagpur" required error={errors.affiliation?.message} {...register("affiliation")}>
                    <option value="">Select…</option>
                    <option>Student</option>
                    <option>Research scholar</option>
                    <option>Faculty / staff</option>
                    <option>Faculty family</option>
                    <option>Alumni</option>
                    <option>Kharagpur resident</option>
                    <option>Other</option>
                  </Select>
                </>
              )}

              {step === 1 && (
                <>
                  <Select label="Where would the animal live?" required error={errors.housing?.message} {...register("housing")}>
                    <option value="">Select…</option>
                    <option>Independent house</option>
                    <option>Apartment</option>
                    <option>Campus quarters</option>
                    <option>Other</option>
                  </Select>
                  <Select label="Do you own or rent?" required error={errors.ownOrRent?.message} {...register("ownOrRent")}>
                    <option value="">Select…</option>
                    <option>Own</option>
                    <option>Rent — pets allowed</option>
                    <option>Rent — need to confirm</option>
                    <option>Institute housing</option>
                  </Select>
                  <label className="flex items-start gap-3 rounded-2xl border border-line bg-parchment p-4 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#173F35]" {...register("householdAgrees")} />
                    <span>
                      <strong className="text-forest-deep">Everyone in my household agrees</strong>{" "}
                      to welcoming this animal.
                      {errors.householdAgrees && (
                        <span role="alert" className="mt-1 block text-xs font-semibold text-terracotta-deep">
                          {errors.householdAgrees.message}
                        </span>
                      )}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-line bg-parchment p-4 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#173F35]" {...register("hasOutdoorSpace")} />
                    <span>
                      <strong className="text-forest-deep">We have safe outdoor space</strong>{" "}
                      (balcony, yard, or campus grounds).
                    </span>
                  </label>
                </>
              )}

              {step === 2 && (
                <>
                  <label className="flex items-start gap-3 rounded-2xl border border-line bg-parchment p-4 text-sm">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#173F35]" {...register("hadPetsBefore")} />
                    <span>
                      <strong className="text-forest-deep">I&apos;ve cared for animals before</strong>{" "}
                      (pets or community animals).
                    </span>
                  </label>
                  <Input
                    label="Current animals at home"
                    placeholder="e.g. one senior cat — or none"
                    hint="Optional, but it helps us match temperaments."
                    error={errors.currentPets?.message}
                    {...register("currentPets")}
                  />
                  <Select label="How long would they be alone on a typical day?" required error={errors.hoursAloneDaily?.message} {...register("hoursAloneDaily")}>
                    <option value="">Select…</option>
                    <option>Rarely alone</option>
                    <option>1–2 hours</option>
                    <option>3–4 hours</option>
                    <option>5–6 hours</option>
                    <option>7+ hours</option>
                  </Select>
                </>
              )}

              {step === 3 && (
                <Textarea
                  label={`Tell us why ${animal.name} feels right for you`}
                  required
                  rows={6}
                  placeholder="There are no wrong answers — we just want to understand the home you're offering."
                  error={errors.motivation?.message}
                  {...register("motivation")}
                />
              )}

              {step === 4 && (
                <div className="space-y-4 rounded-3xl border border-line bg-parchment p-6">
                  <h2 className="font-display text-xl font-bold text-forest-deep">
                    Quick check before we send it
                  </h2>
                  <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                    <div><dt className="font-bold text-moss">Name</dt><dd>{values.name}</dd></div>
                    <div><dt className="font-bold text-moss">Contact</dt><dd>{values.email} · {values.phone}</dd></div>
                    <div><dt className="font-bold text-moss">Affiliation</dt><dd>{values.affiliation}</dd></div>
                    <div><dt className="font-bold text-moss">Home</dt><dd>{values.housing} ({values.ownOrRent})</dd></div>
                    <div><dt className="font-bold text-moss">Experience</dt><dd>{values.hadPetsBefore ? "Has cared for animals" : "First-time carer"}{values.currentPets ? ` · ${values.currentPets}` : ""}</dd></div>
                    <div><dt className="font-bold text-moss">Alone time</dt><dd>{values.hoursAloneDaily}</dd></div>
                  </dl>
                  <div>
                    <dt className="text-sm font-bold text-moss">Why {animal.name}</dt>
                    <dd className="mt-1 whitespace-pre-wrap rounded-xl bg-cream p-3 text-sm leading-relaxed">
                      {values.motivation}
                    </dd>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* controls */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            {step < STEP_TITLES.length - 1 ? (
              <Button type="button" onClick={next} size="lg">
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
                <Check className="h-4 w-4" aria-hidden="true" />
                Submit application
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
