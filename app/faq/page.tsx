import type { Metadata } from "next";
import { getFaq } from "@/services/content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers about adopting, donating, volunteering, reporting, and campus animal care.",
};

// Fallback content shown when the CMS is empty. Curated, honest, matches
// what a first-time visitor most commonly asks.
const FALLBACK = [
  {
    category: "Adoption",
    question: "How do I adopt a dog from KGP PAWS?",
    answer:
      "Start on the Adopt page — pick a paw whose personality fits your home, then submit the 6-step application. A volunteer reaches out to schedule a meet. There's no adoption fee; we only ask for a genuine commitment to lifetime care.",
  },
  {
    category: "Adoption",
    question: "Can students in hostels adopt?",
    answer:
      "Typically no — hostel policies at IIT KGP don't permit resident pets, and abrupt returns are hardest on the animal. Faculty families, staff housing, and off-campus residents are welcome to apply. If you can't commit long-term, supporting a campus resident through donations or volunteering is a great alternative.",
  },
  {
    category: "Donation",
    question: "How can I donate?",
    answer:
      "Donate page has a UPI QR code — scan with any UPI app (GPay, PhonePe, Paytm, BHIM). After paying, submit the confirmation form with your UTR so we can log the contribution to a campaign transparently.",
  },
  {
    category: "Donation",
    question: "Where does the money go?",
    answer:
      "Every rupee goes to the animals it was raised for — vet bills, medicine, feed and boarding. Volunteers are unpaid; there are no salaries.",
  },
  {
    category: "Reporting",
    question: "I saw an injured dog — what do I do?",
    answer:
      "Tap the Report button, upload a photo, mark the zone (Tech Market / Halls / etc.), and describe what you see. A volunteer is paged immediately for emergencies. You'll get a tracking code so you can watch the case progress.",
  },
  {
    category: "Reporting",
    question: "Do I have to give my name and phone?",
    answer:
      "Only if you're willing to be contacted for follow-up. Anonymous reports are accepted and just as valuable — a photo and a zone are usually enough.",
  },
  {
    category: "Volunteering",
    question: "How do I get involved?",
    answer:
      "The Volunteer page has an application. We especially need help with feeding drives, weekend medical camps, and running the Instagram — but any commitment, even one hour a week, is meaningful.",
  },
];

export default async function FaqPage() {
  const rows = await getFaq();
  const items = rows.length > 0 ? rows : FALLBACK;

  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <div className="container-page py-16 md:py-24">
      <header className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
        <p className="eyebrow text-terracotta-deep">Frequently Asked Questions</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] text-forest sm:text-5xl">
          Everything you might want to know
        </h1>
        <p className="mt-4 text-lg text-charcoal/75">
          Missing something? Write to us — we&apos;ll add it here.
        </p>
      </header>

      <div className="mx-auto max-w-3xl space-y-12">
        {Array.from(byCategory.entries()).map(([category, entries]) => (
          <section key={category}>
            <h2 className="mb-6 font-display text-2xl text-forest">{category}</h2>
            <ul className="space-y-4">
              {entries.map((entry, i) => (
                <li
                  key={`${category}-${i}`}
                  className="rounded-2xl border border-line bg-parchment p-6 shadow-soft"
                >
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                      <h3 className="font-display text-lg font-semibold text-forest">
                        {entry.question}
                      </h3>
                      <span
                        className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-forest/20 text-forest transition-transform group-open:rotate-45"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-charcoal/80">
                      {entry.answer}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
