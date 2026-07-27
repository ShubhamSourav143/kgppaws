"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { HandHeart, MapPin, PawPrint } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { Input, Textarea, FieldWrap } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  nextApplicationId,
  saveLocalApplication,
} from "@/lib/local-store";
import { isSupabaseConfigured } from "@/lib/config";
import type { Animal } from "@/types";

/**
 * Adoption request form — a single, simple page.
 *
 * We used to run applicants through a five-step wizard covering housing,
 * work hours and prior pet experience. It scared people off. The society
 * reviews every request personally anyway, so we now just collect what a
 * volunteer needs to make first contact and see the home: name, address,
 * how to reach them, a Google Maps link so they can find the place, and
 * anything the applicant wants us to know up front.
 */
const schema = z.object({
  name: z.string().min(2, "Please share your full name."),
  address: z.string().min(6, "Please share the address where you live."),
  email: z.email("Please share a working email address."),
  phone: z.string().min(8, "Please share a working phone number."),
  mapsLink: z
    .string()
    .min(1, "A Google Maps link helps our volunteer find your home.")
    .url("Please paste the full Google Maps link (starts with https://).") ,
  concern: z.string().max(600, "Please keep this under 600 characters.").optional(),
});

type FormValues = z.infer<typeof schema>;

export function ApplyFlow({ animal }: { animal: Animal }) {
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

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
        affiliation: "", // legacy wizard field — new form does not collect
        address: values.address,
        mapsLink: values.mapsLink,
      },
      // legacy wizard fields kept so any older admin view that reads them
      // does not crash on missing keys; new admin table shows the fields
      // that are actually present
      living: {
        housing: "",
        ownOrRent: "",
        householdAgrees: true,
        hasOutdoorSpace: false,
      },
      experience: {
        hadPetsBefore: false,
        currentPets: "",
        hoursAloneDaily: "",
      },
      motivation: values.concern ?? "",
      demo: true,
    });
    setSubmittedId(id);
  };

  /* ——— thank-you state ——— */
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
        <h1 className="mt-6 max-w-xl text-balance font-display text-3xl font-bold text-forest-deep sm:text-4xl">
          Thank you for your adoption request.
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-moss">
          Our volunteer team has received your application successfully. We
          will review it and contact you shortly.
        </p>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-moss">
          Thank you for choosing to give a loving home to one of our campus
          animals.
        </p>
        <p className="mt-6 rounded-full border border-line bg-parchment px-5 py-2 font-mono text-sm font-bold text-forest">
          {submittedId}
        </p>
        {!isSupabaseConfigured && (
          <p className="mt-3 max-w-sm text-xs italic text-moss/80">
            Demo mode: this application is stored in your browser only.
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/adopt" size="lg">
            Meet other paws
          </ButtonLink>
          <ButtonLink href={`/animal/${animal.slug}`} variant="outline" size="lg">
            Back to {animal.name}
          </ButtonLink>
        </div>
      </div>
    );
  }

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
            photoUrl={animal.photos.find((p) => p.url)?.url}
            fit="contain"
            className="h-20 w-20 shrink-0 lg:h-auto lg:w-full lg:!aspect-square"
          />
          <div className="lg:mt-4">
            <p className="eyebrow text-[10px] text-terracotta-deep">
              Adoption request
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-forest-deep">
              {animal.name}
            </p>
            <p className="mt-1 text-sm italic text-moss">&ldquo;{animal.tagline}&rdquo;</p>
          </div>
        </Link>
      </aside>

      <div>
        <h1 className="font-display text-3xl font-bold text-forest-deep sm:text-4xl">
          Adopt {animal.name}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-charcoal/80">
          Every adoption request is personally reviewed by KGP PAWS volunteers,
          because every animal deserves the right home. Share a few details
          about you and where {animal.name} would live — a volunteer will
          contact you soon to take it forward.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            label="Full name"
            required
            placeholder="Your full name"
            autoComplete="name"
            error={errors.name?.message}
            {...register("name")}
          />

          <Textarea
            label="Address"
            required
            rows={3}
            placeholder="House / flat, street, area, city, PIN code"
            autoComplete="street-address"
            error={errors.address?.message}
            {...register("address")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Phone number"
              type="tel"
              required
              placeholder="+91 …"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>

          <FieldWrap
            label="Google Maps location link"
            htmlFor="adopt-maps"
            hint="Open Google Maps, tap Share, choose Copy link, paste it here."
          >
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss"
                aria-hidden="true"
              />
              <input
                id="adopt-maps"
                type="url"
                required
                inputMode="url"
                placeholder="https://maps.app.goo.gl/…"
                className="w-full rounded-xl border border-line bg-parchment py-3 pl-11 pr-4 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
                {...register("mapsLink")}
              />
            </div>
            {errors.mapsLink?.message && (
              <p role="alert" className="mt-1.5 text-xs font-semibold text-terracotta-deep">
                {errors.mapsLink.message}
              </p>
            )}
          </FieldWrap>

          <Textarea
            label="Any concern"
            rows={4}
            placeholder="Anything you would like us to know — questions, allergies, other pets at home, or nothing at all."
            error={errors.concern?.message}
            hint="Optional. There are no wrong answers."
            {...register("concern")}
          />

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            <HandHeart className="h-5 w-5" aria-hidden="true" />
            Submit Adoption Request
          </Button>
          <p className="text-center text-xs leading-relaxed text-moss">
            Your details are visible only to the adoption coordinators.
            Never shared publicly.
          </p>
        </form>
      </div>
    </div>
  );
}
