"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Info } from "lucide-react";
import { PawMark } from "@/components/brand/Logo";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DemoRoleButtons } from "@/components/auth/DemoRoleButtons";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

function makeSchema(mode: "login" | "signup") {
  return z.object({
    // name is only collected (and validated) on signup
    name: mode === "signup" ? z.string().min(2, "Please tell us your name") : z.string(),
    email: z.email("A valid email is required"),
    password: z.string().min(8, "At least 8 characters"),
  });
}

type Values = z.infer<ReturnType<typeof makeSchema>>;

/**
 * Credential auth (Supabase) with a demo-mode fallback.
 * Live mode: email/password via Supabase Auth; roles come from the
 * `user_roles` table and are enforced by RLS, not by this component.
 */
export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(makeSchema(mode)),
    defaultValues: { name: "" },
  });

  // Preserves the original hard-reload redirect (not router.push) rather
  // than guessing at intent; the mutation just needs to live in an effect,
  // not the submit handler, to satisfy react-hooks/immutability.
  useEffect(() => {
    if (redirecting) {
      window.location.href = "/dashboard";
    }
  }, [redirecting]);

  const onSubmit = async (values: Values) => {
    setServerError(null);
    const supabase = createClient();
    if (!supabase) return; // demo mode — form is disabled below
    setPending(true);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
          })
        : await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { full_name: values.name } },
          });
    setPending(false);
    if (error) {
      setServerError(error.message);
      return;
    }
    setRedirecting(true);
  };

  return (
    <div className="rounded-3xl border border-line bg-parchment p-8 shadow-soft">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream">
        <PawMark className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-3xl font-bold text-forest-deep">
        {mode === "login" ? "Welcome back." : "Join the pack."}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-moss">
        {mode === "login"
          ? "Track your reports, applications and saved paws."
          : "Save animals, track your reports and applications, and see your donation history."}
      </p>

      {isSupabaseConfigured ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {mode === "signup" && (
            <Input label="Full name" required placeholder="Your name" error={errors.name?.message} {...register("name")} />
          )}
          <Input label="Email" type="email" required placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" required placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          {serverError && (
            <p role="alert" className="rounded-xl bg-clay p-3 text-xs font-semibold text-terracotta-deep">
              {serverError}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>
      ) : (
        <div className="mt-6">
          <p className="flex items-start gap-2 rounded-2xl bg-sand-light p-3 text-xs leading-relaxed text-forest-deep">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              <strong>Demo mode</strong> — Supabase isn&apos;t configured, so
              credential sign-{mode === "login" ? "in" : "up"} is disabled.
              Explore any role instantly instead:
            </span>
          </p>
          <div className="mt-4">
            <DemoRoleButtons />
          </div>
        </div>
      )}
    </div>
  );
}
