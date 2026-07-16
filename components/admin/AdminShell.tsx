"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  FileText,
  Home,
  LayoutDashboard,
  Newspaper,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { RequireRole } from "@/components/auth/RequireRole";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { DemoNotice } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/animals", label: "Animals", icon: PawPrint },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/adoptions", label: "Adoptions", icon: Home },
  { href: "/admin/donations", label: "Donations", icon: Coins },
  { href: "/admin/stories", label: "Stories", icon: Newspaper },
];

/**
 * Admin operations shell. UI access requires the admin role; the real
 * enforcement is server-side (Supabase RLS + role checks) — see
 * /supabase/migrations. All admin mutations are audit-logged in live mode.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireRole roles={["admin", "super_admin"]}>
      {(user) => (
        <div className="container-page py-8 sm:py-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-cream">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold text-forest-deep">
                  Operations
                </h1>
                <p className="text-xs font-semibold text-moss">
                  {user.name} · {user.role.replace("_", " ")}
                </p>
              </div>
            </div>
            <SignOutButton />
          </header>

          {/* nav — sidebar on desktop, scrollable tabs on mobile */}
          <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
            <nav aria-label="Admin sections">
              <ul className="flex gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:pb-0 [&::-webkit-scrollbar]:hidden">
                {NAV.map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href} className="shrink-0">
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-bold transition-colors lg:rounded-2xl",
                          active
                            ? "bg-forest text-cream"
                            : "text-forest hover:bg-mist"
                        )}
                      >
                        <item.icon className="h-4 w-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <DemoNotice className="mt-4 hidden lg:block">
                Demo mode: changes live in this browser only. In production
                every admin action is written to the audit log.
              </DemoNotice>
            </nav>

            <div className="min-w-0">{children}</div>
          </div>
        </div>
      )}
    </RequireRole>
  );
}
