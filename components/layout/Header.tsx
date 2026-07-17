"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Siren, LayoutDashboard, LogIn } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useSession } from "@/hooks/use-demo-session";
import { cn } from "@/lib/utils";


export interface HeaderNavItem {
  href: string;
  label: string;
  openInNewTab?: boolean;
}

function Squiggle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 6"
      aria-hidden="true"
      className={cn("absolute -bottom-1.5 left-0 h-[6px] w-full", className)}
      preserveAspectRatio="none"
    >
      <path
        d="M2 4 C 12 1, 22 6, 32 3 S 50 2, 54 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "group relative px-1 py-2 text-sm font-semibold transition-colors",
        active ? "text-terracotta-deep" : "text-forest hover:text-terracotta-deep"
      )}
    >
      {label}
      <Squiggle
        className={cn(
          "text-terracotta transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      />
    </Link>
  );
}

export function Header({ items }: { items?: HeaderNavItem[] } = {}) {
  const NAV = items || [];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close drawer on navigation — adjust state during render rather than in
  // an effect (see https://react.dev/learn/you-might-not-need-an-effect)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const dashboardHref =
    user?.role === "admin" || user?.role === "super_admin"
      ? "/admin"
      : user?.role === "volunteer"
        ? "/dashboard/volunteer"
        : "/dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-cream/90 shadow-soft backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-7">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href={dashboardHref}
              className="hidden items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-mist md:inline-flex"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-mist md:inline-flex"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </Link>
          )}

          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-sm font-bold text-parchment shadow-soft transition-all hover:-translate-y-px hover:bg-terracotta-deep sm:px-5"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Report an Animal</span>
            <span className="sm:hidden">Report</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full text-forest transition-colors hover:bg-mist lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed right-0 top-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col bg-parchment shadow-lift lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="flex items-center justify-between border-b border-line p-5">
                <Logo compact />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-full text-forest hover:bg-mist"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-xl px-4 py-3 font-display text-lg font-semibold transition-colors",
                        active
                          ? "bg-mist text-forest"
                          : "text-charcoal hover:bg-mist hover:text-forest"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto space-y-3 border-t border-line p-5">
                <Link
                  href="/report"
                  className="flex items-center justify-center gap-2 rounded-full bg-terracotta px-5 py-3.5 font-bold text-parchment"
                >
                  <Siren className="h-5 w-5" aria-hidden="true" />
                  Report an Animal
                </Link>
                {user ? (
                  <Link
                    href={dashboardHref}
                    className="flex items-center justify-center gap-2 rounded-full border border-forest/25 px-5 py-3 font-semibold text-forest"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    My dashboard
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      className="flex-1 rounded-full border border-forest/25 px-5 py-3 text-center font-semibold text-forest"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      className="flex-1 rounded-full bg-forest px-5 py-3 text-center font-semibold text-cream"
                    >
                      Join
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
