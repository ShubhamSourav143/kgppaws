import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, requireInteger, requireText, trimOrNull } from "../parse";

const businessHeaders = [
  "Label",
  "URL",
  "Icon",
  "Parent Label",
  "Display Order",
  "Visible",
  "Open In New Tab",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Navigation",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Label"]?.trim()) return null;
        return {
          label: requireText(v["Label"], "Label"),
          url: requireText(v["URL"], "URL"),
          icon: trimOrNull(v["Icon"]),
          parent_label: trimOrNull(v["Parent Label"]),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          visible: parseBoolStrict(v["Visible"], "Visible"),
          open_in_new_tab: v["Open In New Tab"] ? parseBoolStrict(v["Open In New Tab"], "Open In New Tab") : false,
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
