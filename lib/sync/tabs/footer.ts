import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, parseSelect, requireInteger, trimOrNull } from "../parse";

const SECTIONS = ["Social Link", "Quick Link", "Contact", "Copyright", "Newsletter Blurb"] as const;

const businessHeaders = [
  "Section",
  "Display Order",
  "Label",
  "URL",
  "Icon",
  "Value",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Footer",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Section"]?.trim()) return null;
        return {
          section: parseSelect(v["Section"], SECTIONS, "Section").toLowerCase().replace(/ /g, "_"),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          label: trimOrNull(v["Label"]),
          url: trimOrNull(v["URL"]),
          icon: trimOrNull(v["Icon"]),
          value: trimOrNull(v["Value"]),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
