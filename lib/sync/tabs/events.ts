import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolStrict,
  parseDateTime,
  parseSelect,
  requireInteger,
  requireText,
  trimOrNull,
} from "../parse";

const TYPES = [
  "Feeding Drive",
  "Vaccination Camp",
  "Adoption Camp",
  "Fundraiser",
  "Volunteer Meet",
] as const;

const businessHeaders = [
  "Slug",
  "Title",
  "Type",
  "Start Date",
  "End Date",
  "Location",
  "Description",
  "RSVP URL",
  "Featured",
  "Display Order",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Events",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      publicIdColumn: "slug",
      mapRow(v) {
        if (!v["Slug"]?.trim()) return null;
        return {
          slug: requireText(v["Slug"], "Slug"),
          title: requireText(v["Title"], "Title"),
          event_type: parseSelect(v["Type"], TYPES, "Type"),
          starts_at: parseDateTime(v["Start Date"], "Start Date"),
          ends_at: parseDateTime(v["End Date"], "End Date"),
          location: trimOrNull(v["Location"]),
          description: trimOrNull(v["Description"]),
          rsvp_url: trimOrNull(v["RSVP URL"]),
          featured: v["Featured"] ? parseBoolStrict(v["Featured"], "Featured") : false,
          display_order: requireInteger(v["Display Order"], "Display Order"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
