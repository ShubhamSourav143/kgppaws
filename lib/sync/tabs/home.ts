import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolStrict,
  parseInteger,
  parseJsonObject,
  parseSelect,
  requireInteger,
  trimOrNull,
} from "../parse";

const SECTIONS = ["Hero", "Mission", "Stats", "Featured", "Testimonials", "Sponsors", "Videos", "Gallery"] as const;

const businessHeaders = [
  "Section",
  "Display Order",
  "Title",
  "Subtitle",
  "Body",
  "CTA Label",
  "CTA URL",
  "Media Reference",
  "Data (JSON)",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Home",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Section"]?.trim()) return null;
        return {
          section: parseSelect(v["Section"], SECTIONS, "Section").toLowerCase(),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          title: trimOrNull(v["Title"]),
          subtitle: trimOrNull(v["Subtitle"]),
          body: trimOrNull(v["Body"]),
          cta_label: trimOrNull(v["CTA Label"]),
          cta_url: trimOrNull(v["CTA URL"]),
          media_ref: trimOrNull(v["Media Reference"]),
          data: parseJsonObject(v["Data (JSON)"], "Data (JSON)"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
// Silence "no default export" warning — this module registers as a side effect.
void parseInteger;
