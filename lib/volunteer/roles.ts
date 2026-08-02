import {
  Cpu,
  HeartPulse,
  Megaphone,
  MonitorSmartphone,
  PenTool,
  Siren,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * The volunteer roles, shared between the /volunteer page (full list) and the
 * homepage "Volunteer" preview (first few). One source of truth so a new role
 * appears in both places automatically. Icons are lucide components — safe to
 * hold in a shared module and render from a Server Component.
 */
export interface VolunteerRole {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const VOLUNTEER_ROLE_CARDS: VolunteerRole[] = [
  {
    title: "Veterinary Assistance",
    description:
      "Help our volunteer team during vaccination drives, sterilization camps, wound dressing and daily medicine rounds. Students from any background are welcome — we train you on the job.",
    icon: HeartPulse,
  },
  {
    title: "Rescue Operations",
    description:
      "Respond to reports of sick or injured animals on campus, help move them to safe care, and follow up during their recovery. Being local and reachable is more useful than any prior experience.",
    icon: Siren,
  },
  {
    title: "Website Development",
    description:
      "Improve this website — features, forms, dashboards and small fixes. Next.js and TypeScript experience is helpful. Good practice, real users, and code you can show.",
    icon: MonitorSmartphone,
  },
  {
    title: "PCB Design",
    description:
      "Help design small electronics such as GPS collar prototypes and simple health-monitoring devices we are exploring. KiCad or EasyEDA experience welcome.",
    icon: Cpu,
  },
  {
    title: "Volunteer Work",
    description:
      "General on-ground help — feeding rounds, camp logistics, adoption coordination, event support, follow-ups with adopters and reporters. The backbone of everything we do.",
    icon: Users,
  },
  {
    title: "Social Media Handling",
    description:
      "Run the Instagram, WhatsApp broadcasts and other channels. Share rescue updates, adoption stories and campaign posts so the campus community stays connected to the work.",
    icon: Megaphone,
  },
  {
    title: "Poster Design",
    description:
      "Design posters for events, adoption drives, awareness campaigns and social media. Familiarity with Figma, Canva or Photoshop is enough — we care about your eye more than the tool.",
    icon: PenTool,
  },
  {
    title: "Video Editing",
    description:
      "Edit short videos of rescues, recovery journeys, camps and volunteer stories for our channels. Any editor works — Premiere, CapCut, DaVinci Resolve or something else.",
    icon: Video,
  },
];
