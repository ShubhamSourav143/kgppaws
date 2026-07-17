import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { requireText, trimOrNull } from "../parse";

const KNOWN_KEYS = new Set([
  "site_name",
  "site_tagline",
  "logo_url",
  "favicon_url",
  "seo_default_title",
  "seo_default_description",
  "seo_default_og_image",
  "google_analytics_id",
  "google_search_console_verification",
  "theme",
  "announcement_banner",
  "emergency_contact_phone",
  "emergency_contact_email",
  "emergency_contact_whatsapp",
]);

const businessHeaders = ["Key", "Value", "Description"] as const;

const handler: TabHandler = {
  tabName: "Website Settings",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        const key = requireText(v["Key"], "Key");
        if (!KNOWN_KEYS.has(key)) {
          throw new Error(`Key: unknown setting "${key}". Add it to the known-keys registry before syncing.`);
        }
        const rawValue = v["Value"] ?? "";
        // JSONB — quote strings so raw text stays valid JSON when scalar.
        let value: unknown;
        const trimmed = rawValue.trim();
        if (
          trimmed.startsWith("{") ||
          trimmed.startsWith("[") ||
          trimmed === "true" ||
          trimmed === "false" ||
          !Number.isNaN(Number(trimmed))
        ) {
          try {
            value = JSON.parse(trimmed);
          } catch {
            value = trimmed;
          }
        } else {
          value = trimmed;
        }
        return {
          key,
          value,
          description: trimOrNull(v["Description"]),
        };
      },
      // content_settings is keyed by `key`, not `sheet_row_id` — but we still
      // track sheet_row_id for the sync engine. The primary key `key` also
      // needs to be respected; the shared apply engine upserts on sheet_row_id
      // which is fine here (each key has one row).
    });
  },
};

registerHandler(handler);
export {};
