/**
 * KGP PAWS — core domain types.
 * These mirror the Supabase schema in /supabase/migrations and are the
 * single source of truth for both demo-mode data and live data.
 */

export type Species = "dog" | "cat" | "other";
export type Sex = "male" | "female" | "unknown";
export type AnimalSize = "small" | "medium" | "large";

export type HealthStatus =
  | "healthy"
  | "under_treatment"
  | "recovering"
  | "monitoring";

export type AdoptionAvailability =
  | "available"
  | "foster_needed"
  | "not_available"
  | "adopted";

export type Friendliness = "friendly" | "selective" | "cautious" | "shy";

export type MedicalEventType =
  | "vaccination"
  | "deworming"
  | "sterilization"
  | "injury"
  | "treatment"
  | "checkup"
  | "recovery";

export interface MedicalEvent {
  id: string;
  date: string; // ISO date
  type: MedicalEventType;
  title: string;
  note?: string;
}

export interface Sighting {
  id: string;
  date: string;
  zoneId: string;
  note: string;
}

export interface AnimalPhoto {
  id: string;
  caption: string;
  date: string;
}

/** Config for the illustrated portrait system (used until real photos are uploaded via CMS). */
export interface PortraitConfig {
  /** background gradient stops */
  from: string;
  to: string;
  /** fur colors */
  coat: string;
  coatDark: string;
  muzzle: string;
  ear: "floppy" | "pointed" | "half";
  /** distinguishing marks */
  patch?: "left-eye" | "right-eye" | "blaze";
  patchColor?: string;
  tongue?: boolean;
}

export interface Animal {
  id: string; // internal UUID — never exposed in QR codes
  pawsId: string; // e.g. PAWS-KGP-DOG-0012
  slug: string; // e.g. "simba"
  qrToken: string; // opaque token for /p/{token} resolution
  name: string;
  species: Species;
  sex: Sex;
  ageLabel: string; // "~3 years" — campus animals rarely have exact ages
  color: string;
  size: AnimalSize;
  zoneId: string; // public: approximate campus zone only
  tagline: string; // one-line personality, e.g. "Professional biscuit negotiator."
  personality: string[];
  bio: string; // MY STORY narrative
  friendliness: Friendliness;
  vaccinated: boolean;
  sterilized: boolean;
  healthStatus: HealthStatus;
  healthNote: string;
  lastHealthUpdate: string;
  adoption: AdoptionAvailability;
  goodWithPeople: boolean;
  goodWithAnimals: boolean;
  specialCare: boolean;
  emergencyNote?: string;
  portrait: PortraitConfig;
  photos: AnimalPhoto[];
  medicalTimeline: MedicalEvent[];
  sightings: Sighting[];
  /** true for seed data — demo records are always labelled in the UI */
  demo: boolean;
}

export interface CampusZone {
  id: string;
  name: string;
  /** position on the stylized campus map (0–100 viewBox space) */
  x: number;
  y: number;
}

/* ---------------------------------- Reports ---------------------------------- */

export type ReportProblem =
  | "injured"
  | "sick"
  | "unable_to_walk"
  | "bleeding"
  | "vehicle_accident"
  | "distressed"
  | "puppies_kittens_at_risk"
  | "other";

export type ReportSeverity = "emergency" | "urgent" | "moderate" | "low";

export type ReportStatus =
  | "reported"
  | "volunteer_assigned"
  | "on_the_way"
  | "animal_located"
  | "treatment_started"
  | "monitoring"
  | "resolved";

export interface ReportUpdate {
  id: string;
  date: string;
  status: ReportStatus;
  note: string;
}

export interface RescueReport {
  id: string; // public ID, e.g. PAWS-RESCUE-2026-00124
  createdAt: string;
  animalType: Species;
  problem: ReportProblem;
  severity: ReportSeverity;
  zoneId: string;
  locationNote: string;
  description: string;
  status: ReportStatus;
  updates: ReportUpdate[];
  linkedAnimalSlug?: string;
  demo: boolean;
}

/* --------------------------------- Donations --------------------------------- */

export interface CampaignExpense {
  id: string;
  date: string;
  label: string;
  amount: number; // INR
}

export interface CampaignUpdate {
  id: string;
  date: string;
  note: string;
}

export interface DonationCampaign {
  id: string;
  slug: string;
  title: string;
  category:
    | "feeding"
    | "treatment"
    | "vaccination"
    | "sterilization"
    | "recovery"
    | "emergency";
  story: string;
  goal: number; // INR
  raised: number; // INR — comes from verified donations only
  supporters: number;
  animalSlug?: string;
  updates: CampaignUpdate[];
  expenses: CampaignExpense[];
  active: boolean;
  demo: boolean;
}

/* ---------------------------------- Stories ---------------------------------- */

export type StoryCategory =
  | "rescue"
  | "recovery"
  | "adoption"
  | "campus-paw"
  | "volunteer-diary"
  | "education";

export type StoryBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; by?: string }
  | { type: "image"; caption: string; palette: [string, string] }
  | { type: "timeline"; items: { date: string; text: string }[] };

export interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: StoryCategory;
  animalSlug?: string;
  readMinutes: number;
  publishedAt: string;
  author: string;
  heroPalette: [string, string];
  blocks: StoryBlock[];
  featured?: boolean;
  demo: boolean;
}

/* ------------------------------ Adoption flow ------------------------------ */

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "contacted"
  | "meet_scheduled"
  | "approved"
  | "not_selected"
  | "adopted";

export interface AdoptionApplication {
  id: string;
  animalSlug: string;
  createdAt: string;
  status: ApplicationStatus;
  applicant: {
    name: string;
    email: string;
    phone: string;
    affiliation: string;
  };
  living: {
    housing: string;
    ownOrRent: string;
    householdAgrees: boolean;
    hasOutdoorSpace: boolean;
  };
  experience: {
    hadPetsBefore: boolean;
    currentPets: string;
    hoursAloneDaily: string;
  };
  motivation: string;
  demo: boolean;
}

/* ------------------------------- Auth & roles ------------------------------- */

export type UserRole = "user" | "volunteer" | "admin" | "super_admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  demo: boolean;
}

/* ------------------------------ Impact metrics ------------------------------ */

/** Admin-editable — never hardcode these as verified facts in components. */
export interface ImpactMetrics {
  dogsSupported: number;
  catsSupported: number;
  vaccinated: number;
  sterilized: number;
  treated: number;
  adopted: number;
  asOf: string;
  note: string;
}

/* ------------------------------ Volunteer data ------------------------------ */

export interface VolunteerTask {
  id: string;
  title: string;
  due: string;
  kind: "feeding" | "rescue" | "transport" | "photo" | "admin";
  done: boolean;
}
