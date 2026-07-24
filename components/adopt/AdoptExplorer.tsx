"use client";

import { useMemo } from "react";
import { AnimalCard } from "@/components/animals/AnimalCard";
import type { Animal } from "@/types";

export function AdoptExplorer({ animals }: { animals: Animal[] }) {
  const results = useMemo(
    () => animals.filter((a) => a.adoption !== "not_available"),
    [animals]
  );

  return (
    <div className="mt-10">
      <p className="text-sm text-moss" role="status">
        {results.length} {results.length === 1 ? "paw" : "paws"} waiting for a forever home
      </p>

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((a) => (
          <li key={a.slug}>
            <AnimalCard animal={a} className="h-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
