"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, User, HandHeart } from "lucide-react";
import { signInDemo } from "@/lib/local-store";
import type { UserRole } from "@/types";

const ROLES: {
  role: UserRole;
  label: string;
  desc: string;
  icon: typeof User;
  href: string;
}[] = [
  {
    role: "user",
    label: "Explore as User",
    desc: "Saved paws, reports, applications, donations",
    icon: User,
    href: "/dashboard",
  },
  {
    role: "volunteer",
    label: "Explore as Volunteer",
    desc: "Rescue queue, tasks, animal updates",
    icon: HandHeart,
    href: "/dashboard/volunteer",
  },
  {
    role: "admin",
    label: "Explore as Admin",
    desc: "Full operations dashboard & CMS",
    icon: ShieldCheck,
    href: "/admin",
  },
];

/** Demo-mode role switcher — replaces credential auth until Supabase is configured. */
export function DemoRoleButtons() {
  const router = useRouter();
  return (
    <div className="space-y-2.5">
      {ROLES.map((r) => (
        <button
          key={r.role}
          type="button"
          onClick={() => {
            signInDemo(r.role);
            router.push(r.href);
          }}
          className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-cream p-4 text-left transition-all hover:-translate-y-px hover:border-forest/35 hover:shadow-soft"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-forest text-cream transition-transform group-hover:-rotate-6">
            <r.icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-bold text-forest-deep">
              {r.label}
            </span>
            <span className="block text-xs text-moss">{r.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
