"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { Download, Plus, QrCode, RefreshCcw, Search } from "lucide-react";
import { AnimalPortrait } from "@/components/animals/Portrait";
import { HealthChip, AdoptionChip } from "@/components/animals/chips";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { DEMO_ANIMALS } from "@/lib/demo/animals";
import { CAMPUS_ZONES, zoneName } from "@/lib/demo/zones";
import { SITE } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import type { Animal } from "@/types";

/** Generate + download a printable QR tag PNG for an animal. */
async function downloadQr(animal: Animal) {
  const url = `${SITE.url}/p/${animal.qrToken}`;
  const dataUrl = await QRCode.toDataURL(url, {
    width: 1024,
    margin: 2,
    color: { dark: "#173F35", light: "#FCF8F0" },
    errorCorrectionLevel: "H", // tags live outdoors — max damage tolerance
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${animal.pawsId}-qr-tag.png`;
  a.click();
}

export default function AdminAnimalsPage() {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<{ name: string; species: string; zoneId: string }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", species: "dog", zoneId: "" });
  const [regenerated, setRegenerated] = useState<Record<string, string>>({});

  const animals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_ANIMALS;
    return DEMO_ANIMALS.filter((a) =>
      [a.name, a.pawsId, zoneName(a.zoneId)].join(" ").toLowerCase().includes(q)
    );
  }, [query]);

  const nextPawsId = (species: string) =>
    `PAWS-KGP-${species.toUpperCase()}-${String(40 + drafts.length).padStart(4, "0")}`;

  const addDraft = () => {
    if (!form.name.trim() || !form.zoneId) return;
    setDrafts((d) => [...d, { ...form }]);
    setForm({ name: "", species: "dog", zoneId: "" });
    setShowForm(false);
  };

  const regenerate = (slug: string) => {
    // Live mode: deactivates the old qr_tags row and inserts a new token —
    // the printed old tag stops resolving (audit-logged). Demo: local only.
    setRegenerated((r) => ({
      ...r,
      [slug]: Math.random().toString(36).slice(2, 10),
    }));
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-deep">
            Animal management
          </h2>
          <p className="mt-1 text-sm text-moss">
            {DEMO_ANIMALS.length} animals · QR tags print-ready at 1024px
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New animal
        </Button>
      </header>

      {/* create form */}
      {showForm && (
        <section
          aria-label="Create animal"
          className="space-y-4 rounded-3xl border border-forest/25 bg-mist p-6"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Toffee"
            />
            <Select
              label="Species"
              required
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
            >
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="other">Other</option>
            </Select>
            <Select
              label="Campus zone"
              required
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
            >
              <option value="">Select…</option>
              {CAMPUS_ZONES.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-moss">
            A unique PAWS ID ({form.species ? nextPawsId(form.species) : "…"}),
            slug and QR token are generated on save. Photos, health records
            and the full profile are added afterwards from the animal editor.
          </p>
          <div className="flex gap-3">
            <Button onClick={addDraft} disabled={!form.name.trim() || !form.zoneId}>
              Create draft
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      {/* drafts */}
      {drafts.length > 0 && (
        <ul className="space-y-2">
          {drafts.map((d, i) => (
            <li
              key={i}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-forest/30 bg-parchment p-4"
            >
              <p className="font-display text-lg font-bold text-forest-deep">
                {d.name}
                <span className="ml-2 font-mono text-xs font-semibold text-moss">
                  {nextPawsId(d.species)}
                </span>
              </p>
              <div className="flex gap-1.5">
                <Chip tone="sand">Draft (demo — this browser only)</Chip>
                <Chip tone="outline">{zoneName(d.zoneId)}</Chip>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, PAWS ID or zone"
          aria-label="Search animals"
          className="w-full rounded-full border border-line bg-parchment py-3 pl-11 pr-4 text-sm placeholder:text-moss/60 focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
        />
      </div>

      {/* list */}
      <ul className="space-y-3">
        {animals.map((a) => (
          <li
            key={a.slug}
            className="grid gap-4 rounded-3xl border border-line bg-parchment p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
          >
            <AnimalPortrait animal={a} className="h-16 w-16 rounded-2xl" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Link
                  href={`/animal/${a.slug}`}
                  className="font-display text-xl font-bold text-forest-deep underline-offset-4 hover:underline"
                >
                  {a.name}
                </Link>
                <span className="font-mono text-xs font-semibold text-moss">{a.pawsId}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <HealthChip status={a.healthStatus} />
                <AdoptionChip status={a.adoption} />
                <Chip tone="outline">{zoneName(a.zoneId)}</Chip>
                {regenerated[a.slug] && <Chip tone="clay">Tag reissued</Chip>}
              </div>
              <p className="mt-1.5 text-xs text-moss">
                Last health update {formatDate(a.lastHealthUpdate)} · token{" "}
                <span className="font-mono">{regenerated[a.slug] ?? a.qrToken}</span>
              </p>
            </div>
            <div className="flex gap-2 sm:flex-col">
              <Button size="sm" variant="outline" onClick={() => downloadQr(a)}>
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                QR tag
              </Button>
              <Button size="sm" variant="ghost" onClick={() => regenerate(a.slug)}>
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reissue
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-moss">
        <QrCode className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        “Reissue” deactivates a lost tag&apos;s token and generates a
        replacement — the old printed QR stops resolving. In production this
        writes to <span className="font-mono">qr_tags</span> and the audit log.
        Aggregate scan analytics (never scanner identity) appear in the live
        dashboard.
      </p>
    </div>
  );
}
