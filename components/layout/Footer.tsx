import Link from "next/link";
import { Mail, Siren } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SITE, isSupabaseConfigured } from "@/lib/config";

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

const EXPLORE = [
  { href: "/adopt", label: "Adopt a Paw" },
  { href: "/stories", label: "Stories" },
  { href: "/map", label: "Campus Paws Map" },
  { href: "/about", label: "About KGP PAWS" },
];

const ACT = [
  { href: "/report", label: "Report an Animal" },
  { href: "/donate", label: "Donate" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/signup", label: "Create an Account" },
];

const LEGAL = [
  { href: "/about#privacy", label: "Privacy Policy" },
  { href: "/about#animal-data", label: "Animal Data Policy" },
];

export function Footer() {
  return (
    <footer className="bg-forest-deep text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="max-w-sm space-y-4">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-sand">
            Animal Welfare Society, IIT Kharagpur. Rescue, heal, protect —
            and a digital identity for every paw on campus.
          </p>
          <div className="flex gap-3 pt-1">
            <a
              href={SITE.social.instagram}
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:bg-cream/10"
              aria-label="KGP PAWS on Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href={SITE.social.facebook}
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:bg-cream/10"
              aria-label="KGP PAWS on Facebook"
            >
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a
              href={SITE.social.twitter}
              className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:bg-cream/10"
              aria-label="KGP PAWS on X"
            >
              <XIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        <nav aria-label="Explore">
          <h2 className="eyebrow mb-4 text-sand">Explore</h2>
          <ul className="space-y-2.5">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-cream/85 transition-colors hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Take action">
          <h2 className="eyebrow mb-4 text-sand">Take Action</h2>
          <ul className="space-y-2.5">
            {ACT.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-cream/85 transition-colors hover:text-cream">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          <h2 className="eyebrow text-sand">Emergency</h2>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-3 text-sm font-bold text-parchment transition-colors hover:bg-terracotta-deep"
          >
            <Siren className="h-4 w-4" aria-hidden="true" />
            Report an Animal
          </Link>
          <p className="flex items-center gap-2 text-sm text-cream/85">
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <a href={`mailto:${SITE.email}`} className="hover:text-cream">
              {SITE.email}
            </a>
          </p>
          <ul className="space-y-2 pt-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-xs text-cream/60 transition-colors hover:text-cream/90">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col items-center gap-3 py-6 text-center md:flex-row md:justify-between md:text-left">
          <p className="font-display text-sm italic text-sand">
            “Made with compassion for every paw that calls Kharagpur home.”
          </p>
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} KGP PAWS
            {!isSupabaseConfigured && (
              <span className="ml-2 rounded-full border border-cream/20 px-2 py-0.5">
                Demo mode — sample data
              </span>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
