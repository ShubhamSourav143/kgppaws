import { runSheetsToDb } from "../apply";
import { registerHandler } from "./registry";
import type { TabHandler } from "../types";
import { parseBoolStrict, parseCommaList, requireDate, requireText, trimOrNull } from "../parse";

const businessHeaders = [
  "Slug",
  "Title",
  "Category",
  "Related Dog Public ID",
  "Author",
  "Date",
  "Excerpt",
  "Markdown",
  "Tags",
  "SEO Title",
  "SEO Description",
  "Published",
  "Featured",
  "Cover Image",
  "Active",
] as const;

const handler: TabHandler = {
  tabName: "Stories",
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
          category: trimOrNull(v["Category"]) ?? "campus-paw",
          animal_slug: trimOrNull(v["Related Dog Public ID"]),
          author: trimOrNull(v["Author"]) ?? "KGP PAWS",
          excerpt: trimOrNull(v["Excerpt"]) ?? "",
          blocks: [{ type: "markdown", body: requireText(v["Markdown"], "Markdown") }],
          seo_description: trimOrNull(v["SEO Description"]) ?? "",
          status: parseBoolStrict(v["Published"], "Published") ? "published" : "draft",
          featured: v["Featured"] ? parseBoolStrict(v["Featured"], "Featured") : false,
          published_at: requireDate(v["Date"], "Date"),
          is_active: parseBoolStrict(v["Active"], "Active"),
        };
      },
    });
  },
};

registerHandler(handler);
// tags column exists on stories? we don't set it — it stays whatever it was
void parseCommaList;
export {};
