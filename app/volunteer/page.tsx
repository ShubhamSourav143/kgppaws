import type { Metadata } from "next";
import {
  Camera,
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
import { Reveal } from "@/components/motion/Reveal";
import { VolunteerForm } from "@/components/volunteer/VolunteerForm";

export const metadata: Metadata = {
  title: "Volunteer",
  description:
    "Help KGP PAWS look after the animals of IIT Kharagpur. Contribute your skills to veterinary work, rescue operations, tech, design, social media and more.",
  alternates: { canonical: "/volunteer" },
};

interface Role {
  title: string;
  description: string;
  icon: LucideIcon;
}

const ROLES: Role[] = [
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

export default function VolunteerPage() {
  return (
    <div className="pb-24">
      {/* hero */}
      <header className="aurora relative -mt-16 overflow-hidden bg-night pb-16 pt-32 text-ivory md:-mt-20 md:pt-40">
        <div className="container-page max-w-3xl">
          <p className="eyebrow mb-5 text-marigold">Join the pack</p>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            Every skill has a place at KGP PAWS.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/75">
            KGP PAWS runs entirely on volunteers. Whether you can help with an
            injured dog, design a poster, code a feature or share our work on
            Instagram — there is a role for you.
          </p>
          <div className="mt-8">
            <Camera className="hidden" aria-hidden="true" /> {/* legacy import kept warm */}
            <a
              href="#volunteer-form"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-deep to-saffron px-6 py-3 text-sm font-bold text-ivory shadow-ember transition-all hover:brightness-105 active:scale-95"
            >
              Jump to the registration form
            </a>
          </div>
        </div>
      </header>

      {/* roles */}
      <section
        aria-labelledby="roles-h"
        className="container-page mt-14 sm:mt-20"
      >
        <div className="max-w-2xl">
          <Reveal>
            <p className="eyebrow mb-4 text-saffron-deep">Where you can help</p>
            <h2
              id="roles-h"
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl"
            >
              Current work and opportunities.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-charcoal/75">
              Pick anything you would be comfortable with. Coordinators will
              match you with the right team based on your options and
              availability.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role, i) => (
            <Reveal key={role.title} delay={Math.min(i * 0.05, 0.3)} className="h-full">
              <article className="group flex h-full gap-4 rounded-3xl border border-line bg-ivory p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-saffron-deep to-saffron text-ivory shadow-ember transition-transform group-hover:scale-110">
                  <role.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-forest-deep">
                    {role.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-moss">
                    {role.description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* registration form */}
      <section
        aria-labelledby="volform-h"
        className="container-page mt-16 sm:mt-20"
      >
        <div className="mx-auto max-w-2xl">
          <VolunteerForm />
        </div>
      </section>
    </div>
  );
}
