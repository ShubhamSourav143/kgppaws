import Link from "next/link";
import { Mail, Siren } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
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
    case "instagram":
      return <InstagramIcon className={className} />;
    case "facebook":
      return <FacebookIcon className={className} />;
    case "x":
    case "twitter":
      return <XIcon className={className} />;
    default:
      return <InstagramIcon className={className} />;
  }
}


const LEGAL = [
  { href: "/about#privacy", label: "Privacy Policy" },
  { href: "/about#animal-data", label: "Animal Data Policy" },
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
    <footer className="bg-forest-deep text-cream">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="max-w-sm space-y-4">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-sand">
            Animal Welfare Society, IIT Kharagpur. Rescue, heal, protect —
            and a digital identity for every paw on campus.
          </p>
          <div className="flex gap-3 pt-1">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/20 transition-colors hover:bg-cream/10"
                aria-label={`KGP PAWS on ${s.label}`}
              >
                {iconFor(s.icon, "h-4 w-4")}
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Explore">
          <h2 className="eyebrow mb-4 text-sand">Explore</h2>
          <ul className="space-y-2.5">
            {quickLinks.map((l) => (
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
            {acts.map((l) => (
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
            <a href={`mailto:${email}`} className="hover:text-cream">
              {email}
            </a>
          </p>
          {emergencyPhone ? (
            <p className="text-sm text-cream/85">
              <a href={`tel:${emergencyPhone}`} className="hover:text-cream">
                {emergencyPhone}
              </a>
            </p>
          ) : null}
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
            &ldquo;{newsletterBlurb}&rdquo;
          </p>
          <p className="text-xs text-cream/50">
            {copyright}
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
