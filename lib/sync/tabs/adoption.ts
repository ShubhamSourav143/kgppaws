import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolStrict,
  parseCommaList,
  parseJsonObject,
  parseSelect,
  requireInteger,
  trimOrNull,
} from "../parse";

const SECTIONS = ["Intro", "Categories", "Instructions", "Success Stories", "FAQ"] as const;

const businessHeaders = [
  "Section",
  "Display Order",
  "Title",
  "Body",
  "Featured Animals",
  "Data (JSON)",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Adoption",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Section"]?.trim()) return null;
        return {
          section: parseSelect(v["Section"], SECTIONS, "Section")
            .toLowerCase()
            .replace(/ /g, "_"),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          title: trimOrNull(v["Title"]),
          body: trimOrNull(v["Body"]),
          featured_animal_public_ids: parseCommaList(v["Featured Animals"]),
          data: parseJsonObject(v["Data (JSON)"], "Data (JSON)"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
