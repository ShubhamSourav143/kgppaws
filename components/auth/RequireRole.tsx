"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { useSession } from "@/hooks/use-demo-session";
import { DemoRoleButtons } from "@/components/auth/DemoRoleButtons";
import type { ReactNode } from "react";
import type { SessionUser, UserRole } from "@/types";

/**
 * Client-side route guard for dashboards.
 *
 * NOTE — defense in depth: this guard is a UX convenience only. Real
 * authorization lives server-side: Supabase RLS policies (see
 * /supabase/migrations) reject unauthorized reads/writes regardless of
 * what the UI renders. Never rely on hidden buttons for security.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: (user: SessionUser) => ReactNode;
}) {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="container-page space-y-4 py-14" aria-busy="true" aria-label="Loading">
        <div className="h-9 w-64 animate-pulse rounded-full bg-sand-light" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-32 animate-pulse rounded-3xl bg-sand-light" />
          <div className="h-32 animate-pulse rounded-3xl bg-sand-light" />
          <div className="h-32 animate-pulse rounded-3xl bg-sand-light" />
        </div>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-14">
        <div className="w-full max-w-md rounded-3xl border border-line bg-parchment p-8 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-mist text-forest">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-forest-deep">
            {user ? "This area needs a different role." : "Sign in to continue."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-moss">
            {user
              ? `You're signed in as ${user.name} (${user.role.replace("_", " ")}). This page requires: ${roles.join(", ")}.`
              : "This dashboard is role-protected. In demo mode you can explore any role instantly:"}
          </p>
          <div className="mt-6">
            <DemoRoleButtons />
          </div>
          <p className="mt-5 text-center text-xs text-moss">
            or{" "}
            <Link href="/login" className="font-bold underline underline-offset-2">
              go to the sign-in page
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return <>{children(user)}</>;
}
