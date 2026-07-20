"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X, PawPrint, BookOpen, Compass, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import type { SearchResult } from "@/app/api/search/route";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SearchResult["type"], { label: string; icon: typeof PawPrint }> = {
  animal: { label: "Animals", icon: PawPrint },
  story: { label: "Stories", icon: BookOpen },
  page: { label: "Pages", icon: Compass },
};

/**
 * Full-screen search dialog. State lives inside `SearchPanel` and is reset
 * naturally on remount (via React's `key`), so opening the overlay never
 * needs a setState-in-effect.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search KGP PAWS"
          className="fixed inset-0 z-[70] flex items-start justify-center bg-night/70 px-4 pt-[12vh] backdrop-blur-md sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="glass w-full max-w-xl overflow-hidden rounded-3xl shadow-lift"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <SearchPanel onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  // debounced fetch — the fetch callback synchronises with an external
  // system (the API), so setResults here is off the render path.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // clear via callback to avoid an in-effect setState cascade
      const id = requestAnimationFrame(() => setResults([]));
      return () => cancelAnimationFrame(id);
    }
    let cancelled = false;
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setResults(data.results ?? []);
          setActive(0);
        });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].href);
    }
  };

  const grouped = (["animal", "story", "page"] as const).map((type) => ({
    type,
    items: results.filter((r) => r.type === type),
  }));

  let runningIndex = -1;

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-forest/10 px-5 py-4">
        <Search className="h-5 w-5 shrink-0 text-saffron-deep" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search animals, stories, pages…"
          aria-label="Search KGP PAWS"
          autoComplete="off"
          className="w-full bg-transparent text-base text-charcoal outline-none placeholder:text-moss/60"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-moss transition-colors hover:bg-mist"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2">
        {!query.trim() && (
          <p className="px-4 py-8 text-center text-sm text-moss">
            Try &ldquo;Simba&rdquo;, &ldquo;rescue&rdquo;, or &ldquo;donate&rdquo;.
          </p>
        )}
        {query.trim() && results.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-moss">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        )}
        {grouped.map(({ type, items }) => {
          if (items.length === 0) return null;
          const Meta = TYPE_META[type];
          return (
            <div key={type} className="mb-1 last:mb-0">
              <p className="px-4 pb-1.5 pt-3 text-[11px] font-bold uppercase tracking-wider text-moss">
                {Meta.label}
              </p>
              {items.map((r) => {
                runningIndex += 1;
                const idx = runningIndex;
                const isActive = idx === active;
                return (
                  <button
                    key={r.href}
                    type="button"
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(r.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                      isActive ? "bg-saffron/12" : "hover:bg-mist"
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-mist text-forest">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Meta.icon className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-forest-deep">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs text-moss">{r.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="hidden items-center gap-4 border-t border-forest/10 px-5 py-3 text-[11px] font-semibold text-moss sm:flex">
        <span className="inline-flex items-center gap-1">
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
          <ArrowDown className="h-3 w-3" aria-hidden="true" /> Navigate
        </span>
        <span className="inline-flex items-center gap-1">
          <CornerDownLeft className="h-3 w-3" aria-hidden="true" /> Select
        </span>
        <span className="ml-auto inline-flex items-center gap-1">
          <kbd className="rounded border border-forest/20 px-1.5 py-0.5">Esc</kbd> Close
        </span>
      </div>
    </div>
  );
}
