import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, requireDate, requireText, trimOrNull } from "../parse";

const businessHeaders = [
  "Dog Public ID",
  "Date",
  "Doctor",
  "Hospital",
  "Notes",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Sterilization",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      mapRow(v) {
        if (!v["Dog Public ID"]?.trim()) return null;
        return {
          _fk_dog_public_id: requireText(v["Dog Public ID"], "Dog Public ID"),
          procedure_date: requireDate(v["Date"], "Date"),
          doctor: trimOrNull(v["Doctor"]),
          hospital: trimOrNull(v["Hospital"]),
          notes: trimOrNull(v["Notes"]),
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
