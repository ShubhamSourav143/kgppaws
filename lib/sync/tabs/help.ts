import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolStrict,
  parseJsonObject,
  parseSelect,
  requireInteger,
  trimOrNull,
} from "../parse";

const SECTIONS = [
  "Volunteer Opportunities",
  "Foster Information",
  "Emergency Help",
  "Contact Card",
  "How to Help",
] as const;

const businessHeaders = [
  "Section",
  "Display Order",
  "Title",
  "Body",
  "Icon",
  "CTA Label",
  "CTA URL",
  "Data (JSON)",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Help",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Section"]?.trim()) return null;
        const sec = parseSelect(v["Section"], SECTIONS, "Section");
        const dbSection = sec.toLowerCase().replace(/ /g, "_").replace("volunteer_opportunities", "opportunities").replace("foster_information", "foster_info").replace("emergency_help", "emergency").replace("contact_card", "contact_card").replace("how_to_help", "how_to_help");
        return {
          section: dbSection,
          display_order: requireInteger(v["Display Order"], "Display Order"),
          title: trimOrNull(v["Title"]),
          body: trimOrNull(v["Body"]),
          icon: trimOrNull(v["Icon"]),
          cta_label: trimOrNull(v["CTA Label"]),
          cta_url: trimOrNull(v["CTA URL"]),
          data: parseJsonObject(v["Data (JSON)"], "Data (JSON)"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
