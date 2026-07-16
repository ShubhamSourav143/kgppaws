import type { ReportStatus, ApplicationStatus, HealthStatus } from "@/types";

/** Tiny className combiner (clsx-style, no dependency). */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );
}

export function formatDateShort(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short" }
  );
}

export function pct(raised: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  reported: "Reported",
  volunteer_assigned: "Volunteer Assigned",
  on_the_way: "On the Way",
  animal_located: "Animal Located",
  treatment_started: "Treatment Started",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export const REPORT_STATUS_ORDER: ReportStatus[] = [
  "reported",
  "volunteer_assigned",
  "on_the_way",
  "animal_located",
  "treatment_started",
  "monitoring",
  "resolved",
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  contacted: "Contacted",
  meet_scheduled: "Meet Scheduled",
  approved: "Approved",
  not_selected: "Not Selected",
  adopted: "Adopted",
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  under_treatment: "Under Treatment",
  recovering: "Recovering",
  monitoring: "Monitoring",
};

/** Parse an approximate age label ("~3 years", "~4 months") into years. */
export function ageInYears(label: string): number {
  const m = label.match(/([\d.]+)\s*(year|month|week)/i);
  if (!m) return 2;
  const n = parseFloat(m[1]);
  if (/month/i.test(m[2])) return n / 12;
  if (/week/i.test(m[2])) return n / 52;
  return n;
}

/** Deterministic pseudo-random from a string seed (for decorative variation). */
export function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}
