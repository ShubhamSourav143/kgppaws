"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, Siren, LayoutDashboard, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Magnetic } from "@/components/fx/Magnetic";
import { InlineSearch, type InlineSearchHandle } from "@/components/search/InlineSearch";
import { useSession } from "@/hooks/use-demo-session";
import { cn } from "@/lib/utils";

export interface HeaderNavItem {
  href: string;
  label: string;
  openInNewTab?: boolean;
}

function NavLink({ href, label, light }: { href: string; label: string; light: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "group relative px-1 py-2 text-sm font-semibold transition-colors",
        light
          ? active ? "text-chakra-glow" : "text-ivory/90 hover:text-chakra-glow"
          : active ? "text-chakra" : "text-forest hover:text-chakra"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute inset-x-0 -bottom-0.5 h-[2.5px] origin-left rounded-full bg-gradient-to-r from-chakra to-chakra-glow transition-transform duration-300 ease-out",
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

export function Header({ items }: { items?: HeaderNavItem[] } = {}) {
  const NAV = items || [];
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<InlineSearchHandle>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useSession();
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // global Cmd/Ctrl+K opens the inline search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close the overlay on navigation — state-during-render, no effect needed
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  /**
   * Close the overlay when the viewport grows past the lg breakpoint.
   *
   * The overlay is `lg:hidden`, but `open` is plain React state — rotating a
   * phone to landscape or widening a desktop window with the menu open hid the
   * menu while leaving `open === true`, so the effect above kept
   * documentElement.overflow pinned to "hidden". The result was a page that
   * could not be scrolled and no visible menu to close.
   */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches) setOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Escape closes the overlay — expected of anything with role="dialog". */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const dashboardHref =
    user?.role === "admin" || user?.role === "super_admin"
      ? "/admin"
      : user?.role === "volunteer"
        ? "/dashboard/volunteer"
        : "/dashboard";

  const overlayLinks = [
    { href: "/", label: "Home" },
    ...NAV,
  ].filter(
    (l, i, arr) => arr.findIndex((x) => x.href === l.href) === i
  );

  // Marketing pages open with a dark cinematic top — the transparent header
  // renders light there. Every other page keeps the glass pill from the start.
  const lightTop =
    !pathname.startsWith("/adopt/apply") &&
    (pathname === "/" ||
      ["/stories", "/about", "/adopt", "/donate", "/volunteer"].some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ));
  const pill = scrolled || !lightTop;
  const light = lightTop && !scrolled;

  return (
    <>
      {/* data-cursor="solo": the paw cursor drops to a single paw over site
          chrome, whatever formation the section scrolling underneath uses. */}
      <header data-cursor="solo" className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 transition-all duration-500",
            pill
              ? "mt-3 h-14 w-[min(76rem,calc(100%-1.5rem))] rounded-full glass px-4 shadow-soft sm:px-6"
              : "mt-0 h-16 w-full bg-transparent px-5 sm:px-8 md:h-20 lg:px-12"
          )}
        >
          <Logo compact={pill || searchOpen} variant={light ? "light" : "dark"} />

          <nav
            aria-label="Primary"
            aria-hidden={searchOpen}
            className={cn(
              "hidden items-center gap-5 transition-opacity duration-200 lg:flex xl:gap-7",
              searchOpen && "pointer-events-none opacity-0"
            )}
          >
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} light={light} />
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <InlineSearch ref={searchRef} light={light} onOpenChange={setSearchOpen} />

            {user && (
              <Link
                href={dashboardHref}
                className={cn(
                  "hidden items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all md:inline-flex",
                  searchOpen && "pointer-events-none scale-95 opacity-0",
                  light
                    ? "border-ivory/25 bg-ivory/10 text-ivory hover:bg-ivory/20"
                    : "border-forest/15 bg-ivory/60 text-forest hover:bg-ivory"
                )}
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {user.name.split(" ")[0]}
              </Link>
            )}

            <span
              className={cn(
                "hidden transition-all duration-200 sm:inline-block",
                searchOpen && "pointer-events-none scale-95 opacity-0"
              )}
            >
              <Magnetic strength={0.25}>
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-5 py-2.5 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
                >
                  <Siren className="h-4 w-4" aria-hidden="true" />
                  Report an Animal
                </Link>
              </Magnetic>
            </span>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "grid h-11 w-11 place-items-center rounded-full transition-colors lg:hidden",
                light ? "text-ivory hover:bg-ivory/10" : "text-forest hover:bg-mist"
              )}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            data-cursor="solo"
            className="aurora fixed inset-0 z-[60] flex flex-col bg-night text-ivory lg:hidden"
            initial={reduced ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 3.5rem) 2.5rem)" }}
            animate={reduced ? { opacity: 1 } : { clipPath: "circle(150% at calc(100% - 3.5rem) 2.5rem)" }}
            exit={reduced ? { opacity: 0 } : { clipPath: "circle(0% at calc(100% - 3.5rem) 2.5rem)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-16 items-center justify-between px-5">
              <Logo variant="light" compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full text-ivory hover:bg-ivory/10"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <motion.nav
              aria-label="Mobile"
              className="flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-8 pb-8"
              initial="hidden"
              animate="show"
              transition={{ staggerChildren: 0.06, delayChildren: 0.18 }}
            >
              {overlayLinks.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href + "/"));
                return (
                  <motion.div
                    key={item.href}
                    variants={{
                      hidden: { opacity: 0, y: 28 },
                      show: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-baseline gap-3 py-2 font-display text-4xl font-semibold tracking-tight",
                        active ? "text-marigold" : "text-ivory hover:text-gold-soft"
                      )}
                    >
                      {item.label}
                      <ArrowUpRight
                        className="h-5 w-5 opacity-0 transition-opacity group-hover:opacity-70"
                        aria-hidden="true"
                      />
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-6 py-3.5 font-bold text-ivory shadow-ember"
                >
                  <Siren className="h-5 w-5" aria-hidden="true" />
                  Report an Animal
                </Link>
                {user && (
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-6 py-3.5 font-semibold text-ivory"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    My dashboard
                  </Link>
                )}
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
