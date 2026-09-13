import type { ContentSectionRow, FaqItem, FooterItem, NavigationItem } from "@/services/content";

export const DEMO_HOME_CONTENT: ContentSectionRow[] = [
  {
    id: "demo-home-hero",
    section: "Hero",
    displayOrder: 0,
    title: "Every Paw Has a Story.",
    subtitle: "Rescue. Heal. Protect. Remember.",
    body: "Building a digital identity and a safer future for the animals of IIT Kharagpur.",
    ctaLabel: "Meet Our Paws",
    ctaUrl: "/adopt",
    mediaRef: null,
    icon: null,
    data: {},
  },
  {
    id: "demo-home-mission",
    section: "Mission",
    displayOrder: 1,
    title: "Before it was ours, it was theirs too.",
    subtitle: "Our Campus. Their Home.",
    body: "The animals of IIT Kharagpur share this campus with students,\nfaculty, staff and visitors — the same lanes, the same monsoons,\nthe same 2\u00A0AM chai runs. They are not strays passing\nthrough. They are residents.\n\nKGP PAWS exists so that sharing a home means sharing its care:\nfood that arrives on time, treatment that arrives faster, and a\nname — a real, recorded identity — for every paw on campus.",
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  },
  {
    id: "demo-home-stats",
    section: "Stats",
    displayOrder: 2,
    title: "Care you can count.",
    subtitle: "Live Impact",
    body: null,
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  },
  {
    id: "demo-home-featured",
    section: "Featured",
    displayOrder: 3,
    title: "The residents, in person.",
    subtitle: "Meet the Paws",
    body: "Every card is a real profile — health record, personality, and all.",
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  }
];

export const DEMO_ADOPTION_CONTENT: ContentSectionRow[] = [
  {
    id: "demo-adopt-intro",
    section: "intro",
    displayOrder: 0,
    title: "Maybe Your Best Friend Is Waiting.",
    subtitle: null,
    body: "Every animal here is vaccinated, health-assessed, and known personally by our volunteers. Filters help; so does an open mind.",
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  },
];

export const DEMO_DONATE_CONTENT: ContentSectionRow[] = [
  {
    id: "demo-donate-intro",
    section: "intro",
    displayOrder: 0,
    title: "Small Help. Real Impact.",
    subtitle: null,
    body: "Every rupee is assigned to a campaign, and every campaign publishes its expenses. You will always know where your support went.",
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  },
];

export const DEMO_HELP_CONTENT: ContentSectionRow[] = [
  {
    id: "demo-help-intro",
    section: "intro",
    displayOrder: 0,
    title: "The pack runs on people like you.",
    subtitle: null,
    body: "No experience needed — just reliability and a soft spot for wet noses. Tell us what you're good at; we'll find where it helps most.",
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {},
  },
  {
    id: "demo-help-roles",
    section: "volunteer_opportunities",
    displayOrder: 1,
    title: null,
    subtitle: null,
    body: null,
    ctaLabel: null,
    ctaUrl: null,
    mediaRef: null,
    icon: null,
    data: {
      opportunities: [
        { icon: "soup", role: "Feeding", description: "Join a route. Dogs will know your cycle's sound within a week." },
        { icon: "siren", role: "Rescue response", description: "First assessment and coordination when reports come in." },
        { icon: "bike", role: "Animal transport", description: "Vet runs and camp-day logistics — a two-wheeler is a superpower." },
        { icon: "camera", role: "Photography", description: "Profile portraits and recovery documentation for every paw." },
        { icon: "megaphone", role: "Social media", description: "Tell the stories that find adopters and donors." },
        { icon: "monitor-smartphone", role: "Website & tech", description: "This platform is student-built. Ship the next feature." },
        { icon: "coins", role: "Fundraising", description: "Campaigns, campus drives, and donor transparency reports." },
        { icon: "home", role: "Adoption coordination", description: "Applications, meet-and-greets, and follow-up visits." },
      ]
    },
  },
  {
    id: "demo-help-emergency",
    section: "Emergency Help",
    displayOrder: 2,
    title: "Found an Animal Who Needs Help?",
    subtitle: null,
    body: "A report takes less than sixty seconds — and it reaches the volunteers closest to you.",
    ctaLabel: "Report an Animal",
    ctaUrl: "/report",
    mediaRef: null,
    icon: null,
    data: {},
  }
];

export const DEMO_FAQ: FaqItem[] = [];

export const DEMO_FOOTER: FooterItem[] = [
  { id: "demo-f1", section: "social_link", displayOrder: 0, label: "Instagram", url: "https://instagram.com/kgppaws", icon: "instagram", value: null },
  { id: "demo-f2", section: "social_link", displayOrder: 1, label: "Facebook", url: "https://facebook.com/kgppaws", icon: "facebook", value: null },
  { id: "demo-f3", section: "social_link", displayOrder: 2, label: "Email", url: "mailto:hello@kgppaws.org", icon: "mail", value: null },
  { id: "demo-f4", section: "quick_link", displayOrder: 0, label: "Adopt a Paw", url: "/adopt", icon: null, value: null },
  { id: "demo-f5", section: "quick_link", displayOrder: 1, label: "Our Work", url: "/stories", icon: null, value: null },
  { id: "demo-f7", section: "quick_link", displayOrder: 2, label: "About KGP PAWS", url: "/about", icon: null, value: null },
  // /faq is a dedicated, categorised FAQ page that was otherwise unreachable —
  // no nav or footer link pointed at it. Surfacing it here resolves the orphan.
  { id: "demo-f11", section: "quick_link", displayOrder: 3, label: "FAQ", url: "/faq", icon: null, value: null },
  { id: "demo-f8", section: "contact", displayOrder: 0, label: "Report an Animal", url: "/report", icon: null, value: null },
  { id: "demo-f9", section: "contact", displayOrder: 1, label: "Donate", url: "/donate", icon: null, value: null },
  { id: "demo-f10", section: "contact", displayOrder: 2, label: "Volunteer", url: "/volunteer", icon: null, value: null },
  { id: "demo-f12", section: "newsletter_blurb", displayOrder: 0, label: null, url: null, icon: null, value: "Made with compassion for every paw that calls Kharagpur home." },
];

export const DEMO_NAVIGATION: NavigationItem[] = [
  { id: "demo-n0", label: "Home", url: "/", icon: null, parentLabel: null, displayOrder: 0, openInNewTab: false },
  { id: "demo-n1", label: "Adopt", url: "/adopt", icon: null, parentLabel: null, displayOrder: 1, openInNewTab: false },
  { id: "demo-n2", label: "Our Work", url: "/stories", icon: null, parentLabel: null, displayOrder: 2, openInNewTab: false },
  { id: "demo-n4", label: "Donate", url: "/donate", icon: null, parentLabel: null, displayOrder: 3, openInNewTab: false },
  { id: "demo-n5", label: "Volunteer", url: "/volunteer", icon: null, parentLabel: null, displayOrder: 4, openInNewTab: false },
  { id: "demo-n6", label: "About", url: "/about", icon: null, parentLabel: null, displayOrder: 5, openInNewTab: false },
  { id: "demo-n3", label: "Help", url: "/report/bite", icon: null, parentLabel: null, displayOrder: 6, openInNewTab: false },
];

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  type: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  rsvpUrl: string | null;
  featured: boolean;
  displayOrder: number;
}

export interface VolunteerItem {
  id: string;
  name: string;
  role: string | null;
  contact: string | null;
  photoPath: string | null;
  responsibilities: string[];
  bio: string | null;
  displayOrder: number;
}

export const DEMO_EVENTS: EventItem[] = [];
export const DEMO_VOLUNTEERS: VolunteerItem[] = [];
