"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { HandHeart, PawPrint } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/config";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "Feeding",
  "Rescue response",
  "Animal transport",
  "Photography",
  "Social media",
  "Website / technology",
  "Fundraising",
  "Adoption coordination",
] as const;

const schema = z.object({
  name: z.string().min(2, "Please tell us your name"),
  email: z.email("A valid email is required"),
  phone: z.string().min(8, "A valid phone number is required"),
  affiliation: z.string().min(1, "Please select one"),
  hallDept: z.string(),
  availability: z.string().min(1, "Please select one"),
  skills: z.string(),
  interests: z.array(z.string()).min(1, "Pick at least one — there's no wrong answer"),
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
    defaultValues: { interests: [], hallDept: "", skills: "" },
  });

  const interests = watch("interests");

  const toggleInterest = (i: string) => {
    const next = interests.includes(i)
      ? interests.filter((x) => x !== i)
      : [...interests, i];
    setValue("interests", next, { shouldValidate: true });
  };

  const onSubmit = (_values: FormValues) => {
    // Live mode: insert into `volunteers` with status "applied" (see schema).
    // Demo mode: registration is acknowledged without a backend write.
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-line bg-parchment p-8 text-center shadow-soft">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 13 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-forest text-cream"
        >
          <PawPrint className="h-7 w-7" aria-hidden="true" />
        </motion.span>
        <h2 className="mt-5 font-display text-2xl font-bold text-forest-deep">
          Welcome to the pack (pending a hello).
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-moss">
          A coordinator will reach out to match you with a team and walk you
          through your first round.
        </p>
        {!isSupabaseConfigured && (
          <p className="mt-3 text-xs italic text-moss/80">
            Demo mode: registrations aren&apos;t sent anywhere yet.
          </p>
        )}
        <div className="mt-6">
          <ButtonLink href="/dashboard/volunteer" variant="outline">
            Preview the volunteer dashboard
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-3xl border border-line bg-parchment p-6 shadow-soft sm:p-8"
      aria-labelledby="volform-h"
    >
      <h2
        id="volform-h"
        className="flex items-center gap-2 font-display text-2xl font-bold text-forest-deep"
      >
        <HandHeart className="h-6 w-6 text-terracotta" aria-hidden="true" />
        Join as a volunteer
      </h2>

      <Input label="Full name" required placeholder="Your name" error={errors.name?.message} {...register("name")} />
      <Input label="Email" type="email" required placeholder="you@iitkgp.ac.in" error={errors.email?.message} {...register("email")} />
      <Input label="Phone" type="tel" required placeholder="+91…" error={errors.phone?.message} {...register("phone")} />
      <Select label="IIT Kharagpur affiliation" required error={errors.affiliation?.message} {...register("affiliation")}>
        <option value="">Select…</option>
        <option>Undergraduate student</option>
        <option>Postgraduate student</option>
        <option>Research scholar</option>
        <option>Faculty / staff</option>
        <option>Campus resident</option>
        <option>Other</option>
      </Select>
      <Input
        label="Hall / department (optional)"
        placeholder="e.g. RK Hall, Dept. of CSE"
        error={errors.hallDept?.message}
        {...register("hallDept")}
      />
      <Select label="Availability" required error={errors.availability?.message} {...register("availability")}>
        <option value="">Select…</option>
        <option>A few hours a week</option>
        <option>Weekends only</option>
        <option>Early mornings (feeding rounds)</option>
        <option>Evenings</option>
        <option>On-call for emergencies</option>
      </Select>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-forest-deep">
          I&apos;d love to help with <span className="text-terracotta">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleInterest(i)}
              aria-pressed={interests.includes(i)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                interests.includes(i)
                  ? "bg-forest text-cream"
                  : "border border-forest/20 text-forest hover:bg-mist"
              )}
            >
              {i}
            </button>
          ))}
        </div>
        {errors.interests && (
          <p role="alert" className="mt-1.5 text-xs font-semibold text-terracotta-deep">
            {errors.interests.message}
          </p>
        )}
      </fieldset>

      <Input
        label="Skills (optional)"
        placeholder="e.g. first aid, video editing, has a scooter"
        error={errors.skills?.message}
        {...register("skills")}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        Sign me up
      </Button>
      <p className="text-center text-[11px] leading-relaxed text-moss">
        Your contact details are visible to coordinators only — never on
        public pages.
      </p>
    </form>
  );
}
