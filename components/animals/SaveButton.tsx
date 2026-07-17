"use client";

import { useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getSavedAnimals, subscribeToLocalStore, toggleSavedAnimal } from "@/lib/local-store";
import { cn } from "@/lib/utils";

/** Outline-heart → filled-heart save toggle (persists in demo storage). */
export function SaveButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const saved = useSyncExternalStore(
    subscribeToLocalStore,
    () => getSavedAnimals().includes(slug),
    () => false
  );
  const [pop, setPop] = useState(false);
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved paws` : `Save ${name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSavedAnimal(slug);
        setPop(true);
      }}
      onAnimationComplete={() => setPop(false)}
      animate={pop && !reduce ? { scale: [1, 1.3, 1] } : {}}
      transition={{ duration: 0.35 }}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full bg-parchment/90 shadow-soft backdrop-blur-sm transition-colors",
        saved ? "text-terracotta" : "text-moss hover:text-terracotta",
        className
      )}
    >
      <Heart
        className="h-5 w-5"
        fill={saved ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </motion.button>
  );
}
