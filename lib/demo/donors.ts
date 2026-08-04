/**
 * DEMO SEED DATA — illustrative donor wall entries.
 *
 * These are NOT real donations and no real person is named. In production the
 * wall is fed from verified donation rows whose donors explicitly opted in to
 * being listed; everyone else is rendered as "Anonymous". The UI labels this
 * list as demo data wherever it appears — see components/donate/DonorWall.tsx.
 */
export interface DemoDonor {
  id: string;
  /** Display name, or "Anonymous" where a donor withheld consent. */
  name: string;
  /** ISO date — the wall sorts newest first. */
  date: string;
  amount: number;
}

export const DEMO_DONORS: DemoDonor[] = [
  { id: "d01", name: "Ananya R.", date: "2026-07-24", amount: 3200 },
  { id: "d02", name: "Anonymous", date: "2026-07-24", amount: 8000 },
  { id: "d03", name: "Rohit Menon", date: "2026-07-23", amount: 1100 },
  { id: "d04", name: "Batch of '19", date: "2026-07-23", amount: 22400 },
  { id: "d05", name: "Sneha K.", date: "2026-07-22", amount: 2000 },
  { id: "d06", name: "Anonymous", date: "2026-07-22", amount: 640 },
  { id: "d07", name: "Vikram S.", date: "2026-07-21", amount: 2500 },
  { id: "d08", name: "Meera Iyer", date: "2026-07-21", amount: 5500 },
  { id: "d09", name: "Hall of Residence, RK", date: "2026-07-20", amount: 9600 },
  { id: "d10", name: "Anonymous", date: "2026-07-20", amount: 500 },
  { id: "d11", name: "Arjun P.", date: "2026-07-19", amount: 220 },
  { id: "d12", name: "Kavya N.", date: "2026-07-19", amount: 500 },
  { id: "d13", name: "Anonymous", date: "2026-07-18", amount: 3200 },
  { id: "d14", name: "Dept. of Mining", date: "2026-07-18", amount: 20000 },
  { id: "d15", name: "Ishaan T.", date: "2026-07-17", amount: 1100 },
  { id: "d16", name: "Priya D.", date: "2026-07-17", amount: 320 },
  { id: "d17", name: "Anonymous", date: "2026-07-16", amount: 25000 },
  { id: "d18", name: "Nikhil B.", date: "2026-07-16", amount: 8000 },
  { id: "d19", name: "Tanvi M.", date: "2026-07-15", amount: 640 },
  { id: "d20", name: "Anonymous", date: "2026-07-15", amount: 13000 },
  { id: "d21", name: "Aditya G.", date: "2026-07-14", amount: 2500 },
  { id: "d22", name: "Shreya V.", date: "2026-07-14", amount: 3200 },
  { id: "d23", name: "Anonymous", date: "2026-07-13", amount: 2000 },
  { id: "d24", name: "Karthik R.", date: "2026-07-13", amount: 5500 },
  { id: "d25", name: "Gymkhana Society", date: "2026-07-12", amount: 22400 },
  { id: "d26", name: "Anonymous", date: "2026-07-12", amount: 8000 },
];
