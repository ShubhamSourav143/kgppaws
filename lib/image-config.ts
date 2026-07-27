/**
 * Single source of truth for every image folder the website reads from.
 *
 * Every folder here lives at `public/images/<path>` and is picked up by
 * `listMedia()` (see `lib/media.ts`) with no code changes — replacing or
 * adding a file in the folder is enough. Nothing outside this file should
 * hardcode one of these path strings; import the key instead.
 *
 * Three folders are excluded from this refactor's changes — `hero/` and
 * `hero-grid/` (the home page Hero and its 4×4 collage) and `footer-dogs/`
 * (the footer's peeking dogs). Their *paths* are still listed below so
 * other, in-scope pages that legitimately reuse that photography (the
 * gallery aggregator, the stories pages) don't hardcode the string — but
 * their *contents* and the components that render them were not touched.
 */
export const IMAGE_FOLDERS = {
  /** Home hero backdrop — public/images/hero/. Component excluded from this
   *  refactor; path kept here only so other pages that read the same
   *  folder (e.g. /gallery) don't hardcode the string. */
  hero: "hero",
  /** Home hero 4×4 collage — public/images/hero-grid/. Same exclusion as
   *  `hero` above: component untouched, path centralized for other readers
   *  (e.g. story pages that used to also show these — no longer do). */
  heroGrid: "hero-grid",
  /** Footer's peeking dog PNGs. Component excluded from this refactor;
   *  nothing outside Footer.tsx reads this path, listed for completeness. */
  footerDogs: "footer-dogs",

  /** Per-animal identity photos — `<slug>.jpg`. The single source of truth
   *  for "what does this animal look like"; every other section either
   *  reuses these or, for the two below, can override them per-section. */
  adopt: "adopt",

  /** Optional per-section override for the home "Featured Rescues" carousel.
   *  Drop `<slug>.jpg` here to show a different photo than the animal's main
   *  `adopt/` cover in that carousel only. Empty = falls back to `adopt/`. */
  featuredDogs: "featured-dogs",

  /** Optional per-section override for the home "Com-Paw-Nions" grid.
   *  Same convention as `featuredDogs`: `<slug>.jpg` wins over `adopt/` for
   *  that section only. Empty = falls back to `adopt/`. */
  companions: "companions",

  /** "Why Adoption Matters" slideshow on /adopt — story-01.jpg … story-NN.jpg,
   *  and the general rescue-story photo pool shared with /stories. */
  stories: "stories",

  /** Donate-page campaign photography, one folder per programme so a
   *  campaign's gallery never has to borrow another campaign's photos. */
  donationFeeding: "donation/feeding",
  donationSterilization: "donation/sterilization",
  donationVaccination: "donation/vaccination",
  donationMedical: "donation/medical",
  /** Reserved for individual animal-specific recovery/treatment appeals
   *  (campaign category "recovery" / "treatment") — currently empty; those
   *  campaign categories fall back to `donationMedical` until photos land
   *  here. See lib/donate/editorial.ts. */
  donationRescue: "donation/rescue",

  /** Volunteer-in-action photos, aggregated onto /gallery. */
  volunteer: "volunteer",
  /** Event/meetup photos, aggregated onto /gallery. */
  events: "events",
  /** Campus-life photos with no other home, aggregated onto /gallery. */
  gallery: "gallery",
  /** Before/after recovery pairs for the home Transformations slider —
   *  file pairs named `<subject>--before.jpg` / `<subject>--after.jpg`. */
  transformation: "transformation",
  /** Long-term campus residents not up for adoption, aggregated onto
   *  /gallery under "Shelter residents". */
  shelterResidents: "shelter-residents",
  /** Generic decorative background photography (currently unused by any
   *  live component — reserved). */
  backgrounds: "backgrounds",

  /** Reserved: adoption-success testimonial photos. No component renders
   *  this folder yet — see docs/IMAGE_GUIDE.md. */
  testimonials: "testimonials",
  /** Reserved: organization/volunteer photos for the /about page, which is
   *  currently text-and-icons only — see docs/IMAGE_GUIDE.md. */
  about: "about",
  /** Reserved: general IIT Kharagpur campus photography, independent of the
   *  excluded home hero. No component renders this folder yet. */
  campus: "campus",
  /** Reserved: decorative UI imagery distinct from `icons/` (app icons) and
   *  `branding/` (logo). No component renders this folder yet. */
  ui: "ui",

  /** Site logo/seal source files — not part of the dog-photo sections. */
  branding: "branding",
} as const;

export type ImageFolderKey = keyof typeof IMAGE_FOLDERS;
export type MediaCollection = (typeof IMAGE_FOLDERS)[ImageFolderKey];
