import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import {
  parseBoolLoose,
  parseBoolStrict,
  parseCommaList,
  parseNumber,
  parseSelect,
  trimOrNull,
} from "../parse";

const businessHeaders = [
  "Public ID",
  "Name",
  "Species",
  "Gender",
  "Age",
  "Breed",
  "Colour",
  "Weight (kg)",
  "Size",
  "Zone",
  "Tagline",
  "Personality",
  "Description",
  "Story",
  "Friendly",
  "Vaccinated",
  "Sterilized",
  "Health Status",
  "Health Note (public)",
  "Internal Note",
  "Adoption Status",
  "Good With People",
  "Good With Animals",
  "Special Care",
  "Notes",
  "Cover Image",
  "Active",
] as const;

const SPECIES = ["Dog", "Cat", "Other"] as const;
const SEX = ["Male", "Female", "Unknown"] as const;
const SIZE = ["Small", "Medium", "Large"] as const;
const FRIENDLY = ["Friendly", "Selective", "Cautious", "Shy"] as const;
const HEALTH = ["Healthy", "Under Treatment", "Recovering", "Monitoring"] as const;
const ADOPT = ["Available", "Foster Needed", "Not Available", "Adopted"] as const;

const handler: TabHandler = {
  tabName: "Dogs",
  businessHeaders,
  async applySheetsToDb(ctx) {
    return runSheetsToDb(ctx, {
      businessHeaders,
      publicIdColumn: "public_id",
      mapRow(v) {
        if (!v["Name"]?.trim()) return null;
        const species = parseSelect(v["Species"], SPECIES, "Species").toLowerCase();
        return {
          name: v["Name"].trim(),
          species,
          sex: parseSelect(v["Gender"], SEX, "Gender").toLowerCase(),
          age_label: trimOrNull(v["Age"]) ?? "Unknown age",
          breed: trimOrNull(v["Breed"]) ?? "",
          color: trimOrNull(v["Colour"]) ?? "",
          size: parseSelect(v["Size"], SIZE, "Size").toLowerCase(),
          zone_id: trimOrNull(v["Zone"]) ?? "main-building",
          tagline: trimOrNull(v["Tagline"]) ?? "",
          personality: parseCommaList(v["Personality"]),
          bio: trimOrNull(v["Description"]) ?? trimOrNull(v["Story"]) ?? "",
          friendliness: parseSelect(v["Friendly"], FRIENDLY, "Friendly").toLowerCase(),
          vaccinated: parseBoolStrict(v["Vaccinated"], "Vaccinated"),
          sterilized: parseBoolStrict(v["Sterilized"], "Sterilized"),
          health_status: parseSelect(v["Health Status"], HEALTH, "Health Status")
            .toLowerCase()
            .replace(/ /g, "_"),
          health_note: trimOrNull(v["Health Note (public)"]) ?? "",
          internal_note: trimOrNull(v["Internal Note"]) ?? "",
          adoption_status: parseSelect(v["Adoption Status"], ADOPT, "Adoption Status")
            .toLowerCase()
            .replace(/ /g, "_"),
          good_with_people: v["Good With People"] ? parseBoolLoose(v["Good With People"]) : false,
          good_with_animals: v["Good With Animals"] ? parseBoolLoose(v["Good With Animals"]) : false,
          special_care: v["Special Care"] ? parseBoolLoose(v["Special Care"]) : false,
          weight_kg: parseNumber(v["Weight (kg)"], "Weight (kg)"),
          is_active: parseBoolStrict(v["Active"], "Active"),
          is_public: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
export {};
