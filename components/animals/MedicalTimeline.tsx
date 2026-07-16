import {
  Syringe,
  Bandage,
  Stethoscope,
  HeartPulse,
  Scissors,
  Pill,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { formatDate } from "@/lib/utils";
import type { MedicalEvent, MedicalEventType } from "@/types";

const ICONS: Record<MedicalEventType, typeof Syringe> = {
  vaccination: Syringe,
  deworming: Pill,
  sterilization: Scissors,
  injury: Bandage,
  treatment: Stethoscope,
  checkup: Stethoscope,
  recovery: HeartPulse,
};

const TONES: Record<MedicalEventType, string> = {
  vaccination: "bg-mist text-forest",
  deworming: "bg-mist text-forest",
  sterilization: "bg-sand-light text-forest-deep",
  injury: "bg-clay text-terracotta-deep",
  treatment: "bg-sand-light text-forest-deep",
  checkup: "bg-mist text-forest",
  recovery: "bg-forest text-cream",
};

/** Public medical timeline — internal/volunteer notes are never rendered here. */
export function MedicalTimeline({ events }: { events: MedicalEvent[] }) {
  const sorted = [...events].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <ol className="relative space-y-6 border-l-2 border-line pl-6">
      {sorted.map((e, i) => {
        const Icon = ICONS[e.type];
        return (
          <Reveal key={e.id} delay={Math.min(i * 0.06, 0.3)}>
            <li className="relative">
              <span
                className={`absolute -left-[2.45rem] grid h-9 w-9 place-items-center rounded-full border-4 border-cream ${TONES[e.type]}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="rounded-2xl border border-line bg-parchment p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-moss">
                  {formatDate(e.date)}
                </p>
                <p className="mt-1 font-display text-lg font-bold text-forest-deep">
                  {e.title}
                </p>
                {e.note && (
                  <p className="mt-1 text-sm leading-relaxed text-moss">{e.note}</p>
                )}
              </div>
            </li>
          </Reveal>
        );
      })}
    </ol>
  );
}
