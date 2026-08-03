// Strip whitespace and any stray BOM (﻿) the value may have picked up
// on its way into Vercel's env store — piping a URL via PowerShell prepends
// a UTF-8 BOM, which then makes fetch throw "Failed to parse URL from …"
// at request time.
const clean = (v: string | undefined) => v?.replace(/^[\s﻿]+|[\s﻿]+$/g, "");
const WEBHOOK_URL = clean(process.env.GOOGLE_SHEET_WEBHOOK_URL);
const DONORS_CSV_URL = clean(process.env.GOOGLE_SHEET_DONORS_CSV_URL);

export type SheetForm = "report" | "volunteer" | "adoption" | "bite";

export interface SheetPayload {
  form: SheetForm;
  data: Record<string, string>;
}

export async function submitToGoogleSheet(payload: SheetPayload): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.error("[sheets] WEBHOOK_URL is not set");
    return false;
  }
  try {
    // Google Apps Script webhooks reject requests with a JSON content-type
    // (they return a redirect and drop the body). Send as text/plain — Apps
    // Script's doPost still receives the JSON in e.postData.contents.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<no body>");
      console.error(`[sheets] webhook non-ok: ${res.status} ${res.statusText} body=${body.slice(0, 200)}`);
    }
    return res.ok;
  } catch (err) {
    console.error("[sheets] webhook threw:", err instanceof Error ? err.message : err);
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
