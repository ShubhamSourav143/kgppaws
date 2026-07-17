import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, parseSelect, requireInteger, requireText } from "../parse";

const CATEGORIES = ["General", "Adoption", "Donation", "Volunteering", "Reporting", "Medical"] as const;

const businessHeaders = ["Category", "Question", "Answer", "Display Order", "Active"] as const;

const handler: TabHandler = {
  tabName: "FAQ",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Question"]?.trim()) return null;
        return {
          category: parseSelect(v["Category"], CATEGORIES, "Category"),
          question: requireText(v["Question"], "Question"),
          answer: requireText(v["Answer"], "Answer"),
          display_order: requireInteger(v["Display Order"], "Display Order"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
