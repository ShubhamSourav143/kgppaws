const WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;
const DONORS_CSV_URL = process.env.GOOGLE_SHEET_DONORS_CSV_URL;

export type SheetForm = "report" | "volunteer" | "adoption" | "bite";

export interface SheetPayload {
  form: SheetForm;
  data: Record<string, string>;
}

export async function submitToGoogleSheet(payload: SheetPayload): Promise<boolean> {
  if (!WEBHOOK_URL) return false;
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface SheetDonor {
  name: string;
  date: string;
  campaignSlug: string;
  amount: number;
}

export async function fetchDonorsFromSheet(): Promise<SheetDonor[] | null> {
  if (!DONORS_CSV_URL) return null;
  try {
    const res = await fetch(DONORS_CSV_URL, {
      next: { revalidate: 300 },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n").slice(1);
    return lines
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        return {
          name: cols[0] || "Anonymous",
          date: cols[1] || "",
          campaignSlug: cols[2] || "",
          amount: parseInt(cols[3] || "0", 10),
        };
      })
      .filter((d) => d.date && d.amount > 0);
  } catch {
    return null;
  }
}
