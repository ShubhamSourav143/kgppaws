import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, parseSelect, requireDate, requireText, trimOrNull } from "../parse";

const EVENT_TYPES = [
  "Vaccination",
  "Deworming",
  "Sterilization",
  "Injury",
  "Treatment",
  "Checkup",
  "Recovery",
] as const;

const businessHeaders = [
  "Dog Public ID",
  "Date",
  "Event Type",
  "Diagnosis",
  "Treatment",
  "Medicine",
  "Veterinarian",
  "Public Note",
  "Internal Note",
  "Documents",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Medical History",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Dog Public ID"]?.trim()) return null;
        return {
          _fk_dog_public_id: requireText(v["Dog Public ID"], "Dog Public ID"),
          event_date: requireDate(v["Date"], "Date"),
          event_type: parseSelect(v["Event Type"], EVENT_TYPES, "Event Type").toLowerCase(),
          title: [v["Diagnosis"], v["Treatment"]].filter(Boolean).join(" — ") || "Medical event",
          public_note: trimOrNull(v["Public Note"]) ?? "",
          internal_note: trimOrNull(v["Internal Note"]) ?? "",
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
      async postUpsert(supabase, payload) {
        const publicId = payload._fk_dog_public_id as string;
        delete payload._fk_dog_public_id;
        const { data: animal } = await supabase
          .from("animals")
          .select("id")
          .eq("public_id", publicId)
          .maybeSingle();
        if (!animal) throw new Error(`Dog Public ID ${publicId} not found`);
        payload.animal_id = animal.id;
        return payload;
      },
    });
  },
};

registerHandler(handler);
export {};
