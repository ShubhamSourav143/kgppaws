import { getFooterContent, getNavigation, getSettings } from "@/services/content";
import { Header, type HeaderNavItem } from "./Header";
import { Footer, type FooterSections } from "./Footer";
import { DonateModal } from "@/components/donate/DonateModal";
import { FloatingReportButton } from "@/components/report/FloatingReportButton";

/**
 * Server component that fetches CMS content for the site chrome (navigation
 * + footer + settings) and hydrates the client Header/Footer with real data.
 * Falls through to built-in fallbacks when the DB is empty.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const [nav, footer, settings] = await Promise.all([
    getNavigation(),
    getFooterContent(),
    getSettings(),
  ]);

  const items: HeaderNavItem[] = nav
    .filter((n) => n.parentLabel === null)
    .map((n) => ({ href: n.url, label: n.label, openInNewTab: n.openInNewTab }));

  const footerSections: FooterSections = {
    socialLinks: footer.filter((f) => f.section === "social_link"),
    quickLinks: footer.filter((f) => f.section === "quick_link"),
    contacts: footer.filter((f) => f.section === "contact"),
    copyright: footer.find((f) => f.section === "copyright")?.value ?? null,
    newsletterBlurb: footer.find((f) => f.section === "newsletter_blurb")?.value ?? null,
  };

  const emergencyPhone = pickString(settings["emergency_contact_phone"]);
  const emergencyEmail = pickString(settings["emergency_contact_email"]);

  return (
    <>
      <Header items={items} />
      {children}
      <Footer sections={footerSections} emergencyEmail={emergencyEmail} emergencyPhone={emergencyPhone} />
      <DonateModal />
      <FloatingReportButton />
    </>
  );
}

function pickString(v: unknown): string | null {
  if (typeof v === "string" && v.trim().length > 0) return v;
  return null;
}
