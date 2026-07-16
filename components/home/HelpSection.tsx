import { Camera, MapPin, MessageSquareText, Siren } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

/** “Found an Animal Who Needs Help?” — calm, high-clarity urgency. */
export function HelpSection() {
  const steps = [
    { icon: Camera, title: "Take a photo", text: "Only if it's safe to do so." },
    { icon: MapPin, title: "Share the location", text: "A campus landmark is enough." },
    { icon: MessageSquareText, title: "Tell us what happened", text: "One line. We'll take it from there." },
  ];

  return (
    <section className="bg-terracotta py-20 text-parchment sm:py-24" aria-labelledby="help-h">
      <div className="container-page text-center">
        <Reveal>
          <p className="eyebrow mb-4 text-parchment/80">Help an Animal</p>
          <h2
            id="help-h"
            className="mx-auto max-w-2xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl"
          >
            Found an Animal Who Needs&nbsp;Help?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-parchment/90">
            A report takes less than sixty seconds — and it reaches the
            volunteers closest to you.
          </p>
        </Reveal>

        <ol className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <li className="flex flex-col items-center gap-3 rounded-3xl bg-terracotta-deep/40 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-parchment text-terracotta-deep">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="eyebrow text-[10px] text-parchment/70">
                  Step {i + 1}
                </span>
                <h3 className="font-display text-lg font-bold">{s.title}</h3>
                <p className="text-sm text-parchment/85">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={0.3}>
          <div className="mt-10">
            <ButtonLink
              href="/report"
              variant="light"
              size="lg"
              className="!text-terracotta-deep"
            >
              <Siren className="h-5 w-5" aria-hidden="true" />
              Report an Animal
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
