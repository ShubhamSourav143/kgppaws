"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PawPrint, Siren, Images, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/adopt", label: "Adopt", icon: PawPrint },
  { href: "/report", label: "Report", icon: Siren, primary: true },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/donate", label: "Donate", icon: Heart },
];

/**
 * Native-app style bottom navigation on small screens.
 * Hidden inside flows that own the thumb zone (report, auth, dashboards).
 */
export function MobileDock() {
  const pathname = usePathname();
  if (
    ["/report", "/admin", "/dashboard", "/login", "/signup"].some((p) =>
      pathname.startsWith(p)
    )
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-3 bottom-3 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="glass mx-auto flex max-w-sm items-end justify-between rounded-[1.75rem] px-3 pb-2 pt-2 shadow-lift">
        {TABS.map(({ href, label, icon: Icon, primary }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                aria-label="Report an animal in need"
                className="-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember ring-4 ring-ivory transition-transform active:scale-90"
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex w-14 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-bold transition-colors",
                active ? "text-saffron-deep" : "text-moss hover:text-forest"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
