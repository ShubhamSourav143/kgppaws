/**
 * Cell-value coercion helpers used by every tab handler's mapper.
 *
 * Sheets returns everything as string. Volunteers write `TRUE` / `yes` / `1`
 * etc. — these helpers normalise into the DB representation and treat
 * blank/whitespace as null.
 */

export function trimOrNull(v: string | undefined | null): string | null {
  if (v === undefined || v === null) return null;
  const s = v.toString().trim();
  return s.length === 0 ? null : s;
}

export function requireText(v: string | undefined | null, field: string): string {
  const s = trimOrNull(v);
  if (!s) throw new Error(`${field}: required`);
  return s;
}

export function parseBoolLoose(v: string | undefined | null): boolean {
  if (v === undefined || v === null) return false;
  const s = v.toString().trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1";
}

export function parseBoolStrict(v: string | undefined | null, field: string): boolean {
  if (v === undefined || v === null) throw new Error(`${field}: required`);
  const s = v.toString().trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(s)) return true;
  if (["false", "no", "n", "0"].includes(s)) return false;
  throw new Error(`${field}: expected TRUE/FALSE, got "${v}"`);
}

export function parseInteger(v: string | undefined | null, field: string): number | null {
  const s = trimOrNull(v);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`${field}: expected integer, got "${s}"`);
  }
  return n;
}

export function requireInteger(v: string | undefined | null, field: string): number {
  const n = parseInteger(v, field);
  if (n === null) throw new Error(`${field}: required`);
  return n;
}

export function parseNumber(v: string | undefined | null, field: string): number | null {
  const s = trimOrNull(v);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`${field}: expected number, got "${s}"`);
  return n;
}

export function parseDate(v: string | undefined | null, field: string): string | null {
  const s = trimOrNull(v);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`${field}: expected YYYY-MM-DD, got "${s}"`);
  }
  return s;
}

export function requireDate(v: string | undefined | null, field: string): string {
  const d = parseDate(v, field);
  if (!d) throw new Error(`${field}: required`);
  return d;
}

export function parseDateTime(v: string | undefined | null, field: string): string | null {
  const s = trimOrNull(v);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`${field}: unparseable datetime "${s}"`);
  }
  return d.toISOString();
}

export function parseCommaList(v: string | undefined | null): string[] {
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseSelect<T extends string>(
  v: string | undefined | null,
  allowed: readonly T[],
  field: string
): T {
  const raw = trimOrNull(v);
  if (!raw) throw new Error(`${field}: required`);
  const normalized = raw.toLowerCase();
  const match = allowed.find(
    (a) => a.toLowerCase() === normalized || a.toLowerCase().replace(/ /g, "_") === normalized.replace(/ /g, "_")
  );
  if (!match) {
    throw new Error(`${field}: expected one of [${allowed.join(", ")}], got "${raw}"`);
  }
  return match;
}

export function parseSelectOptional<T extends string>(
  v: string | undefined | null,
  allowed: readonly T[],
  field: string
): T | null {
  if (!trimOrNull(v)) return null;
  return parseSelect(v, allowed, field);
}

export function parseJsonObject(v: string | undefined | null, field: string): Record<string, unknown> {
  const s = trimOrNull(v);
  if (!s) return {};
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("not an object");
  } catch (e) {
    throw new Error(`${field}: invalid JSON — ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function parseJsonArray(v: string | undefined | null, field: string): unknown[] {
  const s = trimOrNull(v);
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed;
    throw new Error("not an array");
  } catch (e) {
    throw new Error(`${field}: invalid JSON array — ${e instanceof Error ? e.message : String(e)}`);
  }
}
