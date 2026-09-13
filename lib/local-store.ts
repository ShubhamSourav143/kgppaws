"use client";

/**
 * DEMO-MODE client persistence.
 * When Supabase is not configured, user submissions (reports, adoption
 * applications, saved animals, demo session) persist to localStorage so the
 * full product flow is testable end-to-end. Everything stored here is
 * namespaced and clearly demo-only — nothing is presented as verified data.
 */

import type { RescueReport, AdoptionApplication, SessionUser, UserRole } from "@/types";

const NS = "kgppaws.demo.";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(NS + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("kgppaws:store", { detail: key }));
  } catch {
    // storage unavailable (private mode etc.) — demo writes are best-effort
  }
}

/**
 * Subscribe to same-tab demo-store writes, for `useSyncExternalStore`.
 * Lets client-only reads react to storage changes without a
 * `useEffect` + `setState` round trip on mount.
 */
export function subscribeToLocalStore(callback: () => void) {
  window.addEventListener("kgppaws:store", callback);
  return () => window.removeEventListener("kgppaws:store", callback);
}

/**
 * Raw JSON string for a demo-store key. Unlike `read()`, the return value
 * has normal string equality, so it's safe to use as a `useSyncExternalStore`
 * snapshot without re-triggering renders on every check.
 */
export function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(NS + key) ?? "";
  } catch {
    return "";
  }
}

/* ------------------------------ Rescue reports ------------------------------ */

export function getLocalReports(): RescueReport[] {
  return read<RescueReport[]>("reports", []);
}

export function saveLocalReport(report: RescueReport) {
  write("reports", [report, ...getLocalReports()]);
}

export function nextReportId(): string {
  const n = 127 + getLocalReports().length; // demo seed ends at 00126
  return `PAWS-RESCUE-2026-${String(n).padStart(5, "0")}`;
}

/**
 * Re-key a locally stored report once the server has told us the real code.
 *
 * The report is written to localStorage *before* the network call, so the
 * tracking page works even if the submit fails halfway. That provisional id
 * comes from nextReportId() — a per-browser counter. The server mints its own
 * `report_code`, and that is what lands in the database, the volunteers'
 * spreadsheet and the notification email. Without this, the reporter was shown
 * (and tracked under) an id nobody on the volunteer side could look up.
 *
 * No-ops when the ids already match or the provisional row is gone.
 */
export function updateLocalReportId(oldId: string, newId: string) {
  if (!oldId || !newId || oldId === newId) return;
  const reports = getLocalReports();
  if (!reports.some((r) => r.id === oldId)) return;
  write(
    "reports",
    reports.map((r) => (r.id === oldId ? { ...r, id: newId } : r))
  );
}

/* --------------------------- Adoption applications --------------------------- */

export function getLocalApplications(): AdoptionApplication[] {
  return read<AdoptionApplication[]>("applications", []);
}

export function saveLocalApplication(app: AdoptionApplication) {
  write("applications", [app, ...getLocalApplications()]);
}

export function nextApplicationId(): string {
  const n = 42 + getLocalApplications().length;
  return `APP-2026-${String(n).padStart(4, "0")}`;
}

/* ------------------------------- Saved animals ------------------------------- */

export function getSavedAnimals(): string[] {
  return read<string[]>("saved", []);
}

export function toggleSavedAnimal(slug: string): boolean {
  const saved = getSavedAnimals();
  const has = saved.includes(slug);
  write("saved", has ? saved.filter((s) => s !== slug) : [...saved, slug]);
  return !has;
}

/* ------------------------------ Demo donations ------------------------------ */

export interface LocalDonationIntent {
  id: string;
  campaignSlug: string;
  campaignTitle: string;
  amount: number;
  createdAt: string;
  /** Always "pending_verification" in demo mode — we never fake success. */
  status: "pending_verification";
}

export function getLocalDonations(): LocalDonationIntent[] {
  return read<LocalDonationIntent[]>("donations", []);
}

export function saveLocalDonation(d: LocalDonationIntent) {
  write("donations", [d, ...getLocalDonations()]);
}

/* -------------------------------- Demo session ------------------------------- */

const DEMO_NAMES: Record<UserRole, string> = {
  user: "Demo User",
  volunteer: "Demo Volunteer",
  admin: "Demo Admin",
  super_admin: "Demo Super Admin",
};

export function getDemoSession(): SessionUser | null {
  return read<SessionUser | null>("session", null);
}

export function signInDemo(role: UserRole): SessionUser {
  const user: SessionUser = {
    id: `demo-${role}`,
    name: DEMO_NAMES[role],
    email: `${role.replace("_", "-")}@demo.kgppaws.org`,
    role,
    demo: true,
  };
  write("session", user);
  return user;
}

export function signOutDemo() {
  write("session", null);
}
