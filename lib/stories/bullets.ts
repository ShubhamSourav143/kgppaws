import type { Story, StoryBlock } from "@/types";

/**
 * Distil a story into 3–5 short bullet points for the slideshow view.
 *
 * Every rescue story we publish is written as a long-form article, but the
 * slideshow needs a scannable "what happened" list. The picks, in order:
 *
 *   1. Timeline items, when present — they are already short factual beats.
 *   2. Section headings (h2), when there are at least two.
 *   3. First sentences of body paragraphs.
 *   4. Sentence-split of the excerpt itself, as a floor so a story that has
 *      only one or two paragraphs still shows more than one bullet.
 *
 * We always try to reach at least three bullets by combining the above
 * (headings + first-sentences, or an excerpt sentence + paragraphs). Cap
 * at five so the dots row and the list itself don't wrap on mobile.
 */
export function bulletsFromStory(story: Story): string[] {
  const timelineItems = story.blocks
    .filter((b): b is Extract<StoryBlock, { type: "timeline" }> => b.type === "timeline")
    .flatMap((b) => b.items);

  if (timelineItems.length > 0) {
    return timelineItems.slice(0, 5).map((item) => {
      const date = item.date.trim();
      const text = shortenSentence(item.text);
      return date ? `${date} — ${text}` : text;
    });
  }

  const headings = story.blocks
    .filter((b): b is Extract<StoryBlock, { type: "h2" }> => b.type === "h2")
    .map((b) => b.text.trim())
    .filter(Boolean);

  const paragraphSentences = story.blocks
    .filter((b): b is Extract<StoryBlock, { type: "p" }> => b.type === "p")
    .map((b) => firstSentence(b.text))
    .filter(Boolean);

  const excerptSentences = splitSentences(story.excerpt).map(shortenSentence);

  // Rank sources by informational quality and combine until we have five.
  const combined = uniqueInOrder([
    ...headings,
    ...paragraphSentences,
    ...excerptSentences,
  ]);

  if (combined.length >= 3) return combined.slice(0, 5);

  // Story is genuinely very short. Show whatever we have plus a
  // volunteer-review reassurance line so the panel is never almost-empty.
  return [
    ...combined,
    "Every rescue is followed up until the animal is safe and healthy.",
  ].slice(0, 5);
}

/** First sentence of `text`, trimmed to ~140 characters. */
function firstSentence(text: string): string {
  const match = text.match(/[^.!?]+[.!?]?/);
  return shortenSentence(match?.[0] ?? text);
}

/** Split `text` on sentence terminators; trims and drops empties. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Shorten a single line to ~140 characters with a trailing ellipsis. */
function shortenSentence(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > 140 ? `${trimmed.slice(0, 137).trimEnd()}…` : trimmed;
}

/** Preserve first occurrence, drop later duplicates. */
function uniqueInOrder(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
