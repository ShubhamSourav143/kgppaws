"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X, PawPrint } from "lucide-react";
import { AnimalCard } from "@/components/animals/AnimalCard";
import { ageInYears, cn } from "@/lib/utils";
import type { Animal } from "@/types";

type Kind = "all" | "dog" | "cat" | "puppy" | "kitten";

interface Filters {
  kind: Kind;
  breed: string; // "all" or animal.color exact match
  age: "all" | "young" | "adult" | "senior";
  gender: "all" | "male" | "female";
  vaccinated: boolean;
}

const DEFAULT_FILTERS: Filters = {
  kind: "all",
  breed: "all",
  age: "all",
  gender: "all",
  vaccinated: false,
};

function inAgeBand(a: Animal, band: Filters["age"]) {
  const y = ageInYears(a.ageLabel);
  switch (band) {
    case "young":
      return y >= 1 && y < 3;
    case "adult":
      return y >= 3 && y < 6;
    case "senior":
      return y >= 6;
    default:
      return true;
  }
}

function matchesKind(a: Animal, kind: Kind) {
  const y = ageInYears(a.ageLabel);
  switch (kind) {
    case "dog":
      return a.species === "dog";
    case "cat":
      return a.species === "cat";
    case "puppy":
      return a.species === "dog" && y < 1;
    case "kitten":
      return a.species === "cat" && y < 1;
    default:
      return true;
  }
}

function OptionRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-moss">
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
              value === o.id
                ? "bg-gradient-to-r from-saffron-deep to-saffron text-ivory shadow-ember"
                : "border border-forest/20 text-forest hover:bg-mist"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-cream px-3.5 py-2.5 text-sm font-semibold text-forest-deep transition-colors hover:border-forest/30">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#c25f1e]"
      />
    </label>
  );
}

function FilterPanel({
  filters,
  setFilters,
  breeds,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  breeds: string[];
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters({ ...filters, [k]: v });

  return (
    <div className="space-y-6">
      <OptionRow
        label="I'm looking for"
        value={filters.kind}
        options={[
          { id: "all", label: "All" },
          { id: "dog", label: "Dog" },
          { id: "cat", label: "Cat" },
          { id: "puppy", label: "Puppy" },
          { id: "kitten", label: "Kitten" },
        ]}
        onChange={(v) => set("kind", v)}
      />
      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-moss">
          Breed / colour
        </legend>
        <div className="relative">
          <select
            value={filters.breed}
            onChange={(e) => set("breed", e.target.value)}
            className="w-full appearance-none rounded-full border border-forest/20 bg-cream px-4 py-2.5 text-xs font-bold text-forest transition-colors hover:bg-mist focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/25"
            aria-label="Filter by breed or colour"
          >
            <option value="all">Any</option>
            {breeds.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </fieldset>
      <OptionRow
        label="Age"
        value={filters.age}
        options={[
          { id: "all", label: "Any" },
          { id: "young", label: "1–3 yrs" },
          { id: "adult", label: "3–6 yrs" },
          { id: "senior", label: "6+ yrs" },
        ]}
        onChange={(v) => set("age", v)}
      />
      <OptionRow
        label="Gender"
        value={filters.gender}
        options={[
          { id: "all", label: "Any" },
          { id: "male", label: "Male" },
          { id: "female", label: "Female" },
        ]}
        onChange={(v) => set("gender", v)}
      />
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-moss">
          Must have
        </p>
        <Toggle
          label="Vaccinated"
          checked={filters.vaccinated}
          onChange={(v) => set("vaccinated", v)}
        />
      </div>
    </div>
  );
}

export function AdoptExplorer({ animals }: { animals: Animal[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Adopt-only: campus residents ('not_available') never surface here.
  // 'available' + 'foster_needed' both roll up to adoptable; 'adopted' stays
  // in the list as a success story.
  const adoptableAll = useMemo(
    () => animals.filter((a) => a.adoption !== "not_available"),
    [animals]
  );

  const breeds = useMemo(
    () => Array.from(new Set(adoptableAll.map((a) => a.color))).sort(),
    [adoptableAll]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return adoptableAll.filter((a) => {
      if (!matchesKind(a, filters.kind)) return false;
      if (filters.breed !== "all" && a.color !== filters.breed) return false;
      if (!inAgeBand(a, filters.age)) return false;
      if (filters.gender !== "all" && a.sex !== filters.gender) return false;
      if (filters.vaccinated && !a.vaccinated) return false;
      if (
        q &&
        ![a.name, a.tagline, a.color, a.species, ...a.personality]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [adoptableAll, query, filters]);

  const activeCount = Object.values(filters).filter((v) =>
    typeof v === "boolean" ? v : v !== "all"
  ).length;

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden lg:block" aria-label="Adoption filters">
        <div className="glass sticky top-24 max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto rounded-3xl p-6 shadow-soft">
          <FilterPanel filters={filters} setFilters={setFilters} breeds={breeds} />
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-xs font-bold text-terracotta-deep underline"
          >
            Reset all filters
          </button>
        </div>
      </aside>

      <div>
        {/* search + mobile filter trigger */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-moss"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, breed or personality — try &ldquo;brindle&rdquo;"
              aria-label="Search adoptable animals"
              className="w-full rounded-full border border-line bg-ivory py-3 pl-11 pr-4 text-sm shadow-soft placeholder:text-moss/60 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/25"
            />
          </div>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-forest/25 px-4 py-3 text-sm font-bold text-forest lg:hidden"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="grid h-5 w-5 place-items-center rounded-full bg-terracotta text-[10px] text-parchment">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        <p className="mt-4 text-sm text-moss" role="status">
          {results.length} {results.length === 1 ? "paw" : "paws"} waiting for a forever home
        </p>

        {/* results */}
        {results.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((a) => (
              <li key={a.slug}>
                <AnimalCard animal={a} className="h-full" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-forest/25 bg-parchment p-12 text-center">
            <PawPrint className="h-10 w-10 text-sand" aria-hidden="true" />
            <p className="font-display text-xl font-bold text-forest-deep">
              No paws match those filters (yet).
            </p>
            <p className="max-w-sm text-sm text-moss">
              Try widening your search — or check back soon. New paws arrive as
              rescues stabilise and volunteer teams post them.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilters(DEFAULT_FILTERS);
                setQuery("");
              }}
              className="rounded-full bg-forest px-5 py-2.5 text-sm font-bold text-cream"
            >
              Clear everything
            </button>
          </div>
        )}
      </div>

      {/* mobile bottom sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              className="fixed inset-0 z-40 bg-charcoal/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Adoption filters"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[82dvh] overflow-y-auto rounded-t-3xl bg-parchment p-6 pb-10 shadow-lift lg:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="font-display text-xl font-bold text-forest-deep">
                  Filters
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full text-moss hover:bg-mist"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <FilterPanel filters={filters} setFilters={setFilters} breeds={breeds} />
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="flex-1 rounded-full border border-forest/25 px-5 py-3 text-sm font-bold text-forest"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="flex-1 rounded-full bg-forest px-5 py-3 text-sm font-bold text-cream"
                >
                  Show {results.length} paws
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
