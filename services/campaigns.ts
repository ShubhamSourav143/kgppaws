import { createStaticSupabase } from "@/lib/supabase/server";
import { DEMO_CAMPAIGNS, getDemoCampaign } from "@/lib/demo/campaigns";
import type { DonationCampaign } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapCampaignRow(row: any): DonationCampaign {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    story: row.story ?? "",
    goal: row.goal_amount ?? 0,
    // `raised`/`supporters` come from a view over VERIFIED donations only —
    // a donation row only counts after payment-gateway verification.
    raised: row.raised_amount ?? 0,
    supporters: row.supporter_count ?? 0,
    animalSlug: row.animal_slug ?? undefined,
    updates: (row.campaign_updates ?? []).map((u: any) => ({
      id: u.id, date: u.created_at, note: u.note,
    })),
    expenses: (row.campaign_expenses ?? []).map((e: any) => ({
      id: e.id, date: e.spent_on, label: e.label, amount: e.amount,
    })),
    active: row.active ?? true,
    demo: false,
  };
}

export async function listCampaigns(): Promise<DonationCampaign[]> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("campaigns_with_totals")
      .select("*, campaign_expenses(*), campaign_updates(*)")
      .eq("active", true);
    // Intentionally NOT gated on `data.length > 0` — see services/animals.ts
    // for why: a real, legitimately empty result must never fall back to
    // fictional demo campaigns on a connected production database.
    if (!error && data) return data.map(mapCampaignRow);
  }
  return DEMO_CAMPAIGNS;
}

export async function getCampaign(slug: string): Promise<DonationCampaign | undefined> {
  const supabase = createStaticSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("campaigns_with_totals")
      .select("*, campaign_expenses(*), campaign_updates(*)")
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return mapCampaignRow(data);
    return undefined;
  }
  return getDemoCampaign(slug);
}
