import { createServerSupabase } from "@/lib/supabase/server";

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
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data.map(mapSectionRow);
}

/** Homepage sections, ordered. Empty until the Home tab syncs its first rows. */
export function getHomeContent(): Promise<ContentSectionRow[]> {
  return fetchSections("content_home");
}

/** Adopt-page copy sections. */
export function getAdoptionContent(): Promise<ContentSectionRow[]> {
  return fetchSections("content_adoption");
}

/** Donate-page copy sections. */
export function getDonateContent(): Promise<ContentSectionRow[]> {
  return fetchSections("content_donate");
}

/** Help/volunteer-page sections. */
export function getHelpContent(): Promise<ContentSectionRow[]> {
  return fetchSections("content_help");
}

/** Visible navigation items, ordered — top-level first, children after. */
export async function getNavigation(): Promise<NavigationItem[]> {
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content_navigation")
    .select("*")
    .eq("is_active", true)
    .eq("visible", true)
    .is("archived_at", null)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
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
  const supabase = await createServerSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content_footer")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
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
  const supabase = await createServerSupabase();
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
  const supabase = await createServerSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.from("content_settings").select("key, value");
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [row.key, row.value]));
}
