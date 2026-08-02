"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X, PawPrint, BookOpen, Compass, HelpCircle } from "lucide-react";
import type { SearchResult } from "@/app/api/search/handler";
import { cn } from "@/lib/utils";

const TYPE_META: Record<SearchResult["type"], { label: string; icon: typeof PawPrint }> = {
  animal: { label: "Animals", icon: PawPrint },
  story: { label: "Stories", icon: BookOpen },
  faq: { label: "FAQs", icon: HelpCircle },
  page: { label: "Pages", icon: Compass },
};

export interface InlineSearchHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export interface InlineSearchProps {
  light: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Search that lives inside the header. Collapsed: a small round icon
 * button. Expanded: the input slides open in-place, results appear in a
 * floating glass card beneath the header pill. No page-blocking modal.
 *
 * Cmd/Ctrl+K opens+focuses; Esc collapses; blur (outside click) collapses
 * unless a result is active.
 *
 * The `light` prop controls the icon/border colour so it reads on both
 * the transparent cinematic top and the glass-pill scrolled state.
 */
export const InlineSearch = forwardRef<InlineSearchHandle, InlineSearchProps>(
  function InlineSearch({ light, onOpenChange }, ref) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [active, setActive] = useState(0);
    const reduced = useReducedMotion();

    // Notify parent after commit — never during render.
    useEffect(() => {
      onOpenChange?.(open);
    }, [open, onOpenChange]);

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((v) => !v),
    }));

    // focus on open
    useEffect(() => {
      if (!open) return;
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }, [open]);

    // outside click to close
    useEffect(() => {
      if (!open) return;
      const onDoc = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    // debounced fetch; setState lives in the fetch callback (external
    // system), not inline in the effect body.
    useEffect(() => {
      const trimmed = query.trim();
      if (!trimmed) {
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
          })
          .catch(() => {
            /* aborted / offline — leave prior results in place */
          });
      }, 180);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }, [query]);

    const go = (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
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

    let runningIndex = -1;

    return (
      <div ref={rootRef} className="relative">
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.6 }}
          className={cn(
            "flex items-center rounded-full transition-colors",
            open
              ? light
                ? "bg-ivory/15 ring-1 ring-ivory/25"
                : "bg-ivory ring-1 ring-forest/15 shadow-soft"
              : "bg-transparent"
          )}
        >
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close search" : "Search (Ctrl+K)"}
            aria-expanded={open}
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors",
              light
                ? "text-ivory hover:bg-ivory/10"
                : "text-forest hover:bg-mist"
            )}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.input
                key="search-input"
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search animals, breeds, stories…"
                aria-label="Search KGP PAWS"
                autoComplete="off"
                initial={reduced ? { opacity: 0, width: 0 } : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "min(32rem, 60vw)" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "h-11 min-w-0 bg-transparent pr-3 text-sm outline-none placeholder:text-moss/70",
                  light ? "text-ivory placeholder:text-ivory/60" : "text-charcoal"
                )}
              />
            )}
          </AnimatePresence>

          {open && query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className={cn(
                "mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                light ? "text-ivory/80 hover:bg-ivory/10" : "text-moss hover:bg-mist"
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </motion.div>

        {/* Results dropdown — floats below the header pill */}
        <AnimatePresence>
          {open && query.trim() && (
            <motion.div
              role="listbox"
              aria-label="Search results"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass absolute right-0 top-full z-40 mt-3 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-lift"
            >
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {results.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-moss">
                    No matches for &ldquo;{query}&rdquo;.
                  </p>
                ) : (
                  (["animal", "story", "page"] as const).map((type) => {
                    const items = results.filter((r) => r.type === type);
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
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                isActive ? "bg-saffron/12" : "hover:bg-mist"
                              )}
                            >
                              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-mist text-forest">
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
                                <span className="block truncate text-xs text-moss">
                                  {r.subtitle}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
                <p className="mt-1 border-t border-forest/10 px-4 py-2 text-[11px] text-moss">
                  <kbd className="rounded border border-forest/20 px-1.5 py-0.5">Esc</kbd>{" "}
                  to close · <kbd className="rounded border border-forest/20 px-1.5 py-0.5">↑↓</kbd>{" "}
                  navigate · <kbd className="rounded border border-forest/20 px-1.5 py-0.5">Enter</kbd>{" "}
                  open
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
