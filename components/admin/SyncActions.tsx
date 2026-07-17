"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props =
  | { kind: "everything" }
  | { kind: "tab"; tab: string; direction: string }
  | { kind: "resolve"; conflictId: string };

export function SyncActions(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text();
      setError(text || `HTTP ${res.status}`);
      return;
    }
    startTransition(() => router.refresh());
  }

  if (props.kind === "everything") {
    return (
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-terracotta-deep">{error}</span>}
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            const res = await fetch("/api/sync/enqueue-all", {
              method: "POST",
              headers: { "content-type": "application/json" },
              credentials: "include",
            });
            if (!res.ok) setError(await res.text());
            else startTransition(() => router.refresh());
          }}
          className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream shadow-soft hover:bg-forest-deep disabled:opacity-50"
        >
          {pending ? "Enqueuing…" : "Sync everything"}
        </button>
      </div>
    );
  }

  if (props.kind === "tab") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {error && <span className="text-xs text-terracotta-deep">{error}</span>}
        <button
          type="button"
          disabled={pending}
          onClick={() => post("/api/sync/enqueue", { tab: props.tab, direction: props.direction, scope: "incremental" })}
          className="rounded-full border border-forest/25 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist disabled:opacity-50"
        >
          Sync ▸
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            post("/api/sync/enqueue", {
              tab: props.tab,
              direction: props.direction,
              scope: "full",
              forceFullScan: true,
            })
          }
          className="rounded-full border border-forest/25 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist disabled:opacity-50"
        >
          Full
        </button>
      </div>
    );
  }

  return (
    <>
      {error && <span className="text-xs text-terracotta-deep">{error}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => post("/api/sync/resolve", { conflictId: props.conflictId, resolution: "kept_sheet" })}
        className="rounded-full bg-forest px-3 py-1 text-xs font-semibold text-cream hover:bg-forest-deep disabled:opacity-50"
      >
        Keep Sheet
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => post("/api/sync/resolve", { conflictId: props.conflictId, resolution: "kept_db" })}
        className="rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-parchment hover:bg-terracotta-deep disabled:opacity-50"
      >
        Keep DB
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => post("/api/sync/resolve", { conflictId: props.conflictId, resolution: "dismissed" })}
        className="rounded-full border border-forest/25 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist disabled:opacity-50"
      >
        Dismiss
      </button>
    </>
  );
}
