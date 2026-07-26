import Link from "next/link";
import Image from "next/image";
import { Mail, Siren, ArrowUpRight } from "lucide-react";
import { Logo, Seal } from "@/components/brand/Logo";
import { Marquee } from "@/components/fx/Marquee";
import { Reveal } from "@/components/fx/Reveal";
import { SITE, isSupabaseConfigured } from "@/lib/config";
import type { FooterItem } from "@/services/content";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function iconFor(name: string | null | undefined, className: string) {
  switch ((name ?? "").toLowerCase()) {
    case "facebook":
      return <FacebookIcon className={className} />;
    case "x":
    case "twitter":
      return <XIcon className={className} />;
    case "mail":
    case "email":
      return <Mail className={className} />;
    default:
      return <InstagramIcon className={className} />;
  }
}

const LEGAL = [
  { href: "/about#privacy", label: "Privacy Policy" },
  { href: "/about#animal-data", label: "Animal Data Policy" },
];

const MANTRA = ["Rescue", "Heal", "Protect", "Remember"];

/**
 * The four rescues who peek over the top of the footer.
 *
 * Each is used exactly once, with its own slight scale (95–105%) and vertical
 * nudge (±8px) so the row reads as four individuals rather than a stamped
 * strip. Intrinsic dimensions come from the source files, so next/image
 * reserves the right box up front and nothing shifts as they load.
 */
const PETS = [
  { src: "/images/footer-dogs/pet-1.png", w: 720, h: 988, alt: "", scale: 1.02, dy: -6, dur: "5.4s", delay: "0s" },
  { src: "/images/footer-dogs/pet-2.png", w: 720, h: 1385, alt: "", scale: 1.05, dy: -3, dur: "5.7s", delay: "-3.1s" },
  { src: "/images/footer-dogs/pet-3.png", w: 471, h: 750, alt: "", scale: 0.95, dy: 8, dur: "5.9s", delay: "-0.8s" },
  { src: "/images/footer-dogs/pet-4.png", w: 419, h: 751, alt: "", scale: 1.0, dy: -8, dur: "5.5s", delay: "-2.4s" },
];

export interface FooterSections {
  socialLinks: FooterItem[];
  quickLinks: FooterItem[];
  contacts: FooterItem[];
  copyright: string | null;
  newsletterBlurb?: string | null;
}

export function Footer({
  sections,
  emergencyEmail,
  emergencyPhone,
}: {
  sections?: FooterSections;
  emergencyEmail?: string | null;
  emergencyPhone?: string | null;
} = {}) {
  const socials = (sections?.socialLinks || []).map((s) => ({ label: s.label ?? "", url: s.url ?? "#", icon: s.icon }));
  const quickLinks = (sections?.quickLinks || []).map((q) => ({ href: q.url ?? "#", label: q.label ?? "" }));
  const acts = (sections?.contacts || []).map((c) => ({ href: c.url ?? "#", label: c.label ?? "" }));

  const copyright = sections?.copyright ?? `© ${new Date().getFullYear()} KGP PAWS`;
  const newsletterBlurb = sections?.newsletterBlurb;
  const email = emergencyEmail ?? SITE.email;

  return (
    <div className="relative">
      {/* ——— rescues emerging from behind the footer ———
          Absolutely positioned, so it occupies no space in the flow and adds
          no band of its own — the dogs simply stand in whatever section
          precedes the footer. Its top is pinned to the footer's top edge and
          then lifted 72% of its own height, leaving the bottom ~28% of every
          dog behind the footer, which paints over it on a higher z-index.
          Own padding rather than container-page: at this size the dogs need
          close to the full mobile width, and 20px gutters left them touching. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto flex h-36 w-full max-w-7xl -translate-y-[72%] items-end justify-between px-2 sm:h-48 sm:px-8 lg:h-56 lg:px-12"
      >
        {PETS.map((p) => (
          <span
            key={p.src}
            className="footer-pet relative block"
            style={
              {
                top: `${p.dy}px`,
                "--pet-dur": p.dur,
                "--pet-delay": p.delay,
              } as React.CSSProperties
            }
          >
            <Image
              src={p.src}
              alt={p.alt}
              width={p.w}
              height={p.h}
              loading="lazy"
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 260px, 180px"
              className="h-36 w-auto object-contain object-bottom drop-shadow-[0_12px_16px_rgba(10,18,14,0.28)] sm:h-48 lg:h-56"
              style={{ transform: `scale(${p.scale})`, transformOrigin: "bottom center" }}
            />
          </span>
        ))}
      </div>

      {/* The upward shadow is what sells the depth: it falls from the footer's
          own top edge onto the dogs standing behind it. */}
      <footer className="aurora relative z-10 overflow-hidden bg-night pb-24 text-ivory shadow-[0_-18px_38px_-14px_rgba(6,12,9,0.85)] md:pb-0">
        {/* seamless line-art texture — decorative, sits under everything */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage: "url(/images/footer-pattern.svg)",
            backgroundRepeat: "repeat",
            backgroundSize: "260px 260px",
          }}
        />
        <div className="relative z-10">
      {/* mantra marquee */}
      <div className="border-b border-ivory/10 py-5">
        <Marquee duration={28} className="select-none">
          {MANTRA.map((word) => (
            <span key={word} className="flex items-center gap-10">
              <span className="font-display text-2xl font-semibold italic text-gold-soft/90">
                {word}
              </span>
              <span aria-hidden="true" className="text-saffron/70">✦</span>
            </span>
          ))}
        </Marquee>
      </div>

      {/* big CTA */}
      <div className="container-page grid gap-10 py-16 md:grid-cols-[1.5fr_1fr] md:items-center md:py-24">
        <Reveal effect="blur">
          <h2 className="max-w-xl text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Every paw has a story.{" "}
            <span className="italic text-marigold">Be part of the next one.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="flex flex-wrap gap-4 md:justify-end">
          <Link
            href="/adopt"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-7 py-4 font-bold text-ivory shadow-ember transition-transform hover:-translate-y-0.5"
          >
            Meet the paws
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </Link>
          <Link
            href="/donate"
            className="inline-flex items-center gap-2 rounded-full border border-ivory/25 px-7 py-4 font-semibold text-ivory transition-colors hover:bg-ivory/10"
          >
            Donate
          </Link>
        </Reveal>
      </div>

      <div className="container-page grid gap-10 border-t border-ivory/10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="max-w-sm space-y-5">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-ivory/70">
            Animal Welfare Society, IIT Kharagpur. Rescue, heal, protect —
            and a digital identity for every paw on campus.
          </p>
          <div className="flex gap-3 pt-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 transition-all hover:border-saffron hover:bg-saffron/15 hover:text-saffron-glow"
                aria-label={`KGP PAWS on ${s.label}`}
              >
                {iconFor(s.icon, "h-4 w-4")}
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Explore">
          <h2 className="eyebrow mb-4 text-gold-soft/80">Explore</h2>
          <ul className="space-y-2.5">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ivory/75 transition-colors hover:text-marigold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Take action">
          <h2 className="eyebrow mb-4 text-gold-soft/80">Take Action</h2>
          <ul className="space-y-2.5">
            {acts.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-ivory/75 transition-colors hover:text-marigold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          <h2 className="eyebrow text-gold-soft/80">Emergency</h2>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-5 py-3 text-sm font-bold text-ivory shadow-ember transition-transform hover:-translate-y-0.5"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            Report an Animal
          </Link>
          <p className="flex items-center gap-2 text-sm text-ivory/75">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <a href={`mailto:${email}`} className="hover:text-marigold">
              {email}
            </a>
          </p>
          {emergencyPhone ? (
            <p className="text-sm text-ivory/75">
              <a href={`tel:${emergencyPhone}`} className="hover:text-marigold">
                {emergencyPhone}
              </a>
            </p>
          ) : null}
          <ul className="space-y-2 pt-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs text-ivory/45 transition-colors hover:text-ivory/80">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col items-center gap-4 py-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <Seal variant="light" size={40} className="h-9 w-9 opacity-80" />
            {newsletterBlurb ? (
              <p className="font-display text-sm italic text-gold-soft/80">
                &ldquo;{newsletterBlurb}&rdquo;
              </p>
            ) : null}
          </div>
          <p className="text-xs text-ivory/40">
            {copyright}
            {!isSupabaseConfigured && (
              <span className="ml-2 rounded-full border border-ivory/20 px-2 py-0.5">
                Demo mode — sample data
              </span>
            )}
          </p>
        </div>
      </div>
        </div>
      </footer>
    </div>
  );
}
