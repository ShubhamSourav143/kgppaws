import type { CampusZone } from "@/types";

/**
 * Public campus zones for the stylized PAWS map.
 * Coordinates are positions in the map's 0–100 × 0–70 viewBox space —
 * they are intentionally approximate. Precise rescue coordinates are
 * never stored here and are restricted to volunteer/admin roles.
 */
export const CAMPUS_ZONES: CampusZone[] = [
  { id: "main-building", name: "Main Building", x: 48, y: 22 },
  { id: "library", name: "Central Library", x: 40, y: 30 },
  { id: "tech-market", name: "Technology Market", x: 76, y: 26 },
  { id: "nalanda", name: "Nalanda Complex", x: 58, y: 34 },
  { id: "gymkhana", name: "Gymkhana", x: 38, y: 44 },
  { id: "rk-hall", name: "RK Hall", x: 56, y: 48 },
  { id: "vs-hall", name: "VS Hall", x: 68, y: 52 },
  { id: "main-gate", name: "Main Gate", x: 24, y: 16 },
  { id: "hijli", name: "Hijli Side", x: 20, y: 56 },
];

export function zoneName(id: string) {
  return CAMPUS_ZONES.find((z) => z.id === id)?.name ?? "Campus";
}
