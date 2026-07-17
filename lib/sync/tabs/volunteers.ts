import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, parseCommaList, requireInteger, requireText, trimOrNull } from "../parse";

const businessHeaders = [
  "Name",
  "Role",
  "Contact",
  "Photo",
  "Responsibilities",
  "Bio",
  "Display Order",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Volunteers",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Name"]?.trim()) return null;
        return {
          name: requireText(v["Name"], "Name"),
          role: trimOrNull(v["Role"]),
          contact: trimOrNull(v["Contact"]),
          photo_path: trimOrNull(v["Photo"]),
          responsibilities: parseCommaList(v["Responsibilities"]),
          bio: trimOrNull(v["Bio"]),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
