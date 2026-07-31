"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Award, HandHeart, PawPrint } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Volunteer roles the society currently needs help with. Kept in sync with
 * the copy above the form on /volunteer so what a visitor reads and what
 * they can pick match exactly.
 */
export const VOLUNTEER_ROLES = [
  "Veterinary Assistance",
  "Rescue Operations",
  "Website Development",
  "PCB Designer",
  "Volunteer Work",
  "Social Media Handler",
  "Poster Design",
  "Video Editing",
] as const;

const AFFILIATIONS = [
  "Undergraduate student",
  "Postgraduate student",
  "Research scholar",
  "Faculty",
  "Staff",
  "Faculty family",
  "Alumni",
  "Other",
] as const;

const schema = z.object({
  name: z.string().min(2, "Please share your full name."),
  phone: z.string().min(8, "Please share a working phone number."),
  email: z.email("Please share a working email address."),
  affiliation: z.string().min(1, "Please choose one."),
  hall: z.string().min(1, "Please share your hall or department."),
  workOptions: z
    .array(z.string())
    .min(1, "Please pick at least one work option."),
});

type FormValues = z.infer<typeof schema>;

export function VolunteerForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { workOptions: [] },
  });

  const workOptions = watch("workOptions");

  const toggleRole = (role: string) => {
    const next = workOptions.includes(role)
      ? workOptions.filter((r) => r !== role)
      : [...workOptions, role];
    setValue("workOptions", next, { shouldValidate: true });
  };

  const onSubmit = (v: FormValues) => {
    fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: "volunteer",
        data: {
          timestamp: new Date().toISOString(),
          name: v.name,
          phone: v.phone,
          email: v.email,
          affiliation: v.affiliation,
          hall: v.hall,
          workOptions: v.workOptions.join(", "),
        },
      }),
    }).catch(() => {});

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="rounded-3xl border border-line bg-parchment p-8 text-center shadow-soft"
        id="volunteer-form"
      >
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 13 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
        >
          <PawPrint className="h-7 w-7" aria-hidden="true" />
        </motion.span>
        <h2 className="mt-5 font-display text-2xl font-bold text-forest-deep">
          Thank you for signing up.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-moss">
          Our volunteer coordinator will review your application and contact
          you soon to match you with a team.
        </p>
        <div className="mt-5 inline-flex items-start gap-2 rounded-2xl bg-sand-light p-3 text-left text-xs leading-relaxed text-forest-deep">
          <Award className="mt-0.5 h-4 w-4 shrink-0 text-saffron-deep" aria-hidden="true" />
          <span>
            Volunteers who actively contribute and successfully complete their
            assigned work receive an <strong>official NGO Volunteer
            Certificate</strong> from KGP PAWS in recognition of their
            contribution.
          </span>
        </div>
        {!isSupabaseConfigured && (
          <p className="mt-4 text-xs italic text-moss/80">
            Demo mode: sign-ups aren&apos;t sent anywhere yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-8"
      aria-labelledby="volform-h"
      id="volunteer-form"
    >
      <div>
        <h2
          id="volform-h"
          className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
        >
          <HandHeart className="h-6 w-6 text-terracotta" aria-hidden="true" />
          Register as a volunteer
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-moss">
          Fill in a few details and pick the work you would like to help with.
        </p>
      </div>

      <Input
        label="Full name"
        required
        placeholder="Your full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Phone number"
          type="tel"
          required
          placeholder="+91 …"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Email address"
          type="email"
          required
          placeholder="you@gmail.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="IIT Kharagpur affiliation"
          required
          error={errors.affiliation?.message}
          defaultValue=""
          {...register("affiliation")}
        >
          <option value="" disabled>
            Choose one…
          </option>
          {AFFILIATIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Input
          label="Hall / department"
          required
          placeholder="e.g. RK Hall, Dept. of CSE"
          error={errors.hall?.message}
          {...register("hall")}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-forest-deep">
          Work options <span className="text-terracotta">*</span>
          <span className="ml-1 font-normal text-moss">(pick one or more)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {VOLUNTEER_ROLES.map((role) => {
            const selected = workOptions.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                aria-pressed={selected}
                className={cn(
                  "min-h-11 rounded-full px-4 py-2 text-xs font-bold transition-colors",
                  selected
                    ? "bg-forest text-cream"
                    : "border border-forest/20 text-forest hover:bg-mist"
                )}
              >
                {role}
              </button>
            );
          })}
        </div>
        {errors.workOptions && (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-terracotta-deep">
            {errors.workOptions.message}
          </p>
        )}
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        Submit registration
      </Button>
      <p className="rounded-2xl bg-sand-light p-3 text-xs leading-relaxed text-forest-deep">
        <Award className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-saffron-deep" aria-hidden="true" />
        Volunteers who actively contribute and successfully complete their
        assigned work receive an official <strong>NGO Volunteer Certificate</strong>{" "}
        from KGP PAWS as recognition for their contribution.
      </p>
    </form>
  );
}
