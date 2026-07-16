import { createServerSupabase } from "@/lib/supabase/server";
import { DEMO_IMPACT } from "@/lib/demo/metrics";
import type { ImpactMetrics } from "@/types";

/**
 * Impact metrics are admin-editable configuration stored in the
 * `impact_metrics` table — never hardcoded facts.
 */
export async function getImpactMetrics(): Promise<ImpactMetrics> {
  const supabase = await createServerSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("impact_metrics")
      .select("*")
      .order("as_of", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      return {
        dogsSupported: data.dogs_supported,
        catsSupported: data.cats_supported,
        vaccinated: data.vaccinated,
        sterilized: data.sterilized,
        treated: data.treated,
        adopted: data.adopted,
        asOf: data.as_of,
        note: data.note ?? "",
      };
    }
  }
  return DEMO_IMPACT;
}
