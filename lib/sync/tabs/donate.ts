import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolStrict,
  parseInteger,
  parseSelect,
  requireInteger,
  requireText,
  trimOrNull,
} from "../parse";

const CATEGORIES = [
  "Feeding",
  "Treatment",
  "Vaccination",
  "Sterilization",
  "Recovery",
  "Emergency",
] as const;

const businessHeaders = [
  "Campaign Name",
  "Slug",
  "Category",
  "Description",
  "Goal Amount (INR)",
  "Raised Amount (INR)",
  "Display Progress",
  "QR Image",
  "UPI ID",
  "Account Holder",
  "Featured",
  "Display Order",
  "Linked Dog Public ID",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Donate",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      publicIdColumn: "slug",
      mapRow(v) {
        // Only campaign rows are handled here (require Campaign Name).
        // Copy rows (Section-only) would need a separate handler; for now
        // page-level copy comes from Home tab; extend later if needed.
        if (!v["Campaign Name"]?.trim()) return null;
        const goal = requireInteger(v["Goal Amount (INR)"], "Goal Amount (INR)");
        if (goal <= 0) throw new Error("Goal Amount (INR): must be > 0");
        return {
          slug: requireText(v["Slug"], "Slug"),
          title: requireText(v["Campaign Name"], "Campaign Name"),
          category: parseSelect(v["Category"], CATEGORIES, "Category").toLowerCase(),
          story: trimOrNull(v["Description"]) ?? "",
          goal_amount: goal,
          is_active: parseBoolStrict(v["Active"], "Active"),
          active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
void parseInteger;
export {};
