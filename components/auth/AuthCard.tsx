"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Info, PawPrint } from "lucide-react";
import { PawMark } from "@/components/brand/Logo";
import { Input } from "@/components/ui/Field";
import { Button, ButtonLink } from "@/components/ui/Button";
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
 *
 * Signups intentionally do NOT auto-redirect to the dashboard. Every new
 * account starts in a "pending approval" state — the account exists but
 * cannot access user-only features (submitting adoption stories, generating
 * animal QR codes) until an administrator approves it and assigns a role
 * (User / Moderator / Admin). The approval flow lives in the admin area;
 * this card only communicates the state to the person who just signed up.
 *
 * Live mode: email/password via Supabase Auth. The pending state must be
 * enforced server-side by RLS on the `user_roles` / `user_approvals` tables
 * — this UI cannot grant access on its own.
 */
export function AuthCard({ mode }: { mode: "login" | "signup" }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [signupPending, setSignupPending] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(makeSchema(mode)),
    defaultValues: { name: "" },
  });

  // Login (approved) users are hard-reloaded to the dashboard, as before.
  // Signups never redirect — they see the pending-approval screen instead.
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
    if (mode === "signup") {
      setSignupPending(values.email);
    } else {
      setRedirecting(true);
    }
  };

  if (signupPending) {
    return (
      <div className="rounded-3xl border border-line bg-parchment p-8 shadow-soft">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream">
          <Clock className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-forest-deep">
          Account created — pending approval.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
          Thank you for signing up as{" "}
          <strong className="text-forest-deep">{signupPending}</strong>. Every
          new account is reviewed by a KGP PAWS administrator before it can
          submit adoption stories or generate QR codes for animals.
        </p>
        <div className="mt-5 rounded-2xl bg-sand-light p-4 text-sm leading-relaxed text-forest-deep">
          <p className="flex items-start gap-2">
            <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-saffron-deep" aria-hidden="true" />
            <span>
              After approval, an admin will assign you a role —{" "}
              <strong>User</strong>, <strong>Moderator</strong> or{" "}
              <strong>Admin</strong> — and you will be able to sign in
              normally.
            </span>
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="outline">
            Back to the site
          </ButtonLink>
          <ButtonLink href="/login" variant="ghost">
            Go to sign in
          </ButtonLink>
        </div>
      </div>
    );
  }

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
          : "Create an account to submit adoption stories, generate QR codes for approved animals, and track your activity. New accounts are reviewed by an admin before they can post."}
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
          {mode === "signup" && (
            <p className="rounded-2xl bg-sand-light p-3 text-xs leading-relaxed text-forest-deep">
              <Info className="mr-1 inline h-3.5 w-3.5 -translate-y-0.5 text-saffron-deep" aria-hidden="true" />
              Every account starts pending. After admin approval you can be
              assigned a role: <strong>User</strong>, <strong>Moderator</strong>{" "}
              or <strong>Admin</strong>.
            </p>
          )}
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
