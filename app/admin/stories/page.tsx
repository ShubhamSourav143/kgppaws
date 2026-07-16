"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { DemoNotice } from "@/components/ui/Section";
import { DEMO_STORIES, STORY_CATEGORY_LABELS } from "@/lib/demo/stories";
import { formatDate } from "@/lib/utils";
import type { StoryCategory } from "@/types";

interface Draft {
  title: string;
  category: StoryCategory;
  excerpt: string;
  seoDescription: string;
  schedule: string;
}

export default function AdminStoriesPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Draft>({
    title: "",
    category: "rescue",
    excerpt: "",
    seoDescription: "",
    schedule: "",
  });

  const createDraft = () => {
    if (!form.title.trim()) return;
    setDrafts((d) => [form, ...d]);
    setForm({ title: "", category: "rescue", excerpt: "", seoDescription: "", schedule: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-deep">
            Story CMS
          </h2>
          <p className="mt-1 text-sm text-moss">
            Draft → preview → publish (or schedule). SEO metadata per story.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New story
        </Button>
      </header>

      {showForm && (
        <section aria-label="Create story" className="space-y-4 rounded-3xl border border-forest/25 bg-mist p-6">
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. The Night Shift: Rescue Diaries"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as StoryCategory })}
            >
              {Object.entries(STORY_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Input
              label="Schedule (optional)"
              type="date"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              hint="Leave empty to keep as draft"
            />
          </div>
          <Textarea
            label="Excerpt"
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="One or two sentences shown on story cards."
          />
          <Textarea
            label="SEO meta description"
            rows={2}
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            hint="~155 characters. Used for search engines & social previews."
          />
          <div className="flex gap-3">
            <Button onClick={createDraft} disabled={!form.title.trim()}>
              Save draft
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {/* drafts */}
      {drafts.length > 0 && (
        <section aria-label="Drafts">
          <h3 className="eyebrow mb-3 text-terracotta-deep">Drafts</h3>
          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-forest/30 bg-parchment p-4"
              >
                <div>
                  <p className="font-display text-lg font-bold text-forest-deep">{d.title}</p>
                  <p className="mt-0.5 text-xs text-moss">
                    {STORY_CATEGORY_LABELS[d.category]}
                    {d.schedule ? ` · scheduled ${formatDate(d.schedule)}` : " · unscheduled"}
                  </p>
                </div>
                <Chip tone="sand">Draft (demo — this browser only)</Chip>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* published */}
      <section aria-label="Published stories">
        <h3 className="eyebrow mb-3 text-terracotta-deep">Published</h3>
        <ul className="space-y-2.5">
          {DEMO_STORIES.map((s) => (
            <li
              key={s.slug}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-parchment p-4"
            >
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-snug text-forest-deep">
                  {s.title}
                </p>
                <p className="mt-1 text-xs text-moss">
                  {STORY_CATEGORY_LABELS[s.category]} · {formatDate(s.publishedAt)} · {s.readMinutes} min
                  {s.featured && " · featured on home"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Chip tone="forest">Published</Chip>
                <Link
                  href={`/stories/${s.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-forest/20 px-3.5 py-2 text-xs font-bold text-forest transition-colors hover:bg-mist"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Preview
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <DemoNotice>
        The full block editor (rich text, photos, video embeds, related-animal
        linking) ships with the live CMS — the stories table and story_media
        schema are ready in /supabase/migrations.
      </DemoNotice>
    </div>
  );
}
