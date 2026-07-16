/**
 * Environment + site configuration.
 *
 * The app runs fully in DEMO MODE when Supabase credentials are absent:
 * all reads come from clearly-labelled seed data in /lib/demo, and all
 * writes persist to localStorage on the client. Nothing is faked as
 * verified production data.
 */

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const isMapboxConfigured = Boolean(
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN
);

export const isPaymentConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
);

export const SITE = {
  name: "KGP PAWS",
  fullName: "KGP PAWS — Animal Welfare Society, IIT Kharagpur",
  tagline: "Every Paw Has a Story.",
  description:
    "Rescue. Heal. Protect. Remember. Building a digital identity and a safer future for the animals of IIT Kharagpur.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kgppaws.org",
  email: "hello@kgppaws.org",
  emergencyLabel: "Report an animal",
  social: {
    instagram: "https://instagram.com/kgppaws",
    facebook: "https://facebook.com/kgppaws",
    twitter: "https://x.com/kgppaws",
  },
} as const;
