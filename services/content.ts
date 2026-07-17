import { createStaticSupabase } from "@/lib/supabase/server";
import {
  DEMO_ADOPTION_CONTENT,
  DEMO_DONATE_CONTENT,
  DEMO_EVENTS,
  DEMO_FOOTER,
  DEMO_HELP_CONTENT,
  DEMO_HOME_CONTENT,
  DEMO_NAVIGATION,
  DEMO_VOLUNTEERS,
  type EventItem,
  type VolunteerItem,
} from "@/lib/demo/content";

/**
 * Read layer for the Sheets-synced content tables (M-CMS-2).
 *
 * Contract, matching every other services/* module: Supabase when configured,
 * graceful fallback otherwise. Fallback here is *empty* (not demo fixtures) —
 * callers keep their existing built-in copy as the default and only switch to
 * CMS content when rows exist. That makes the M-CMS-2 rollout safe: pages
 * render identically until the corresponding Sheets tab is populated and
 * synced, at which point the CMS content takes over.
 *
 * All queries filter is_active AND archived_at IS NULL — archived rows live
 * on in the DB but never render (CMS_ARCHITECTURE.md §4.5).
 */

export interface ContentSectionRow {
  id: string;
  section: string;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  mediaRef: string | null;
  icon: string | null;
  data: Record<string, unknown>;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  parentLabel: string | null;
  displayOrder: number;
  openInNewTab: boolean;
}

export interface FooterItem {
  id: string;
  section: "social_link" | "quick_link" | "contact" | "copyright" | "newsletter_blurb";
  displayOrder: number;
  label: string | null;
  url: string | null;
  icon: string | null;
  value: string | null;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase rows are untyped until codegen lands */
function mapSectionRow(row: any): ContentSectionRow {
  return {
    id: row.id,
    section: row.section,
    displayOrder: row.display_order ?? 0,
    title: row.title ?? null,
    subtitle: row.subtitle ?? null,
    body: row.body ?? null,
    ctaLabel: row.cta_label ?? null,
    ctaUrl: row.cta_url ?? null,
    mediaRef: row.media_ref ?? null,
    icon: row.icon ?? null,
    data: (row.data as Record<string, unknown>) ?? {},
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchSections(
  table: "content_home" | "content_adoption" | "content_donate" | "content_help"
): Promise<ContentSectionRow[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("is_active", true)
      .is("archived_at", null)
      .order("display_order", { ascending: true });
    if (!error && data && data.length > 0) return data.map(mapSectionRow);
  }
  return [];
}

/** Homepage sections, ordered. Empty until the Home tab syncs its first rows. */
export async function getHomeContent(): Promise<ContentSectionRow[]> {
  const data = await fetchSections("content_home");
  return data.length > 0 ? data : DEMO_HOME_CONTENT;
}

/** Adopt-page copy sections. */
export async function getAdoptionContent(): Promise<ContentSectionRow[]> {
  const data = await fetchSections("content_adoption");
  return data.length > 0 ? data : DEMO_ADOPTION_CONTENT;
}

/** Donate-page copy sections. */
export async function getDonateContent(): Promise<ContentSectionRow[]> {
  const data = await fetchSections("content_donate");
  return data.length > 0 ? data : DEMO_DONATE_CONTENT;
}

/** Help/volunteer-page sections. */
export async function getHelpContent(): Promise<ContentSectionRow[]> {
  const data = await fetchSections("content_help");
  return data.length > 0 ? data : DEMO_HELP_CONTENT;
}

/** Visible navigation items, ordered — top-level first, children after. */
export async function getNavigation(): Promise<NavigationItem[]> {
  const supabase = createStaticSupabase();
  if (!supabase) return DEMO_NAVIGATION;
  const { data, error } = await supabase
    .from("content_navigation")
    .select("*")
    .eq("is_active", true)
    .eq("visible", true)
    .is("archived_at", null)
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return DEMO_NAVIGATION;
  return data.map((row) => ({
    id: row.id,
    label: row.label,
    url: row.url,
    icon: row.icon ?? null,
    parentLabel: row.parent_label ?? null,
    displayOrder: row.display_order ?? 0,
    openInNewTab: Boolean(row.open_in_new_tab),
  }));
}

/** Footer elements, ordered within each section. */
export async function getFooterContent(): Promise<FooterItem[]> {
  const supabase = createStaticSupabase();
  if (!supabase) return DEMO_FOOTER;
  const { data, error } = await supabase
    .from("content_footer")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return DEMO_FOOTER;
  return data.map((row) => ({
    id: row.id,
    section: row.section,
    displayOrder: row.display_order ?? 0,
    label: row.label ?? null,
    url: row.url ?? null,
    icon: row.icon ?? null,
    value: row.value ?? null,
  }));
}

/** FAQ entries grouped by category order then display order. */
export async function getFaq(): Promise<FaqItem[]> {
  const supabase = createStaticSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content_faq")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    displayOrder: row.display_order ?? 0,
  }));
}

/**
 * Site settings as a key → value map. Values are JSONB; scalar values come
 * back as their JS primitives, structured ones as objects.
 */
export async function getSettings(): Promise<Record<string, unknown>> {
  const supabase = createStaticSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.from("content_settings").select("key, value");
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}

/** Upcoming events. */
export async function getEvents(): Promise<EventItem[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("content_events")
      .select("*")
      .eq("is_active", true)
      .is("archived_at", null)
      .order("display_order", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        startsAt: row.starts_at,
        endsAt: row.ends_at ?? null,
        location: row.location ?? null,
        description: row.description ?? null,
        rsvpUrl: row.rsvp_url ?? null,
        featured: row.featured ?? false,
        displayOrder: row.display_order ?? 0,
      }));
    }
  }
  return DEMO_EVENTS;
}

/** Volunteer directory. */
export async function getVolunteerDirectory(): Promise<VolunteerItem[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("volunteer_directory")
      .select("*")
      .eq("is_active", true)
      .is("archived_at", null)
      .order("display_order", { ascending: true });
    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role ?? null,
        contact: row.contact ?? null,
        photoPath: row.photo_path ?? null,
        responsibilities: row.responsibilities ?? [],
        bio: row.bio ?? null,
        displayOrder: row.display_order ?? 0,
      }));
    }
  }
  return DEMO_VOLUNTEERS;
}
