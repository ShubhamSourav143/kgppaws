"use client";

import { useEffect, useState } from "react";
import { getDemoSession } from "@/lib/local-store";
import type { SessionUser } from "@/types";

/**
 * Client hook for the current session.
 * Demo mode: reads the localStorage demo session and stays in sync across
 * tabs/components. Live mode: swap for Supabase auth state (see README).
 */
export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sync = () => {
      setUser(getDemoSession());
      setLoading(false);
    };
    sync();
    window.addEventListener("kgppaws:store", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("kgppaws:store", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { user, loading };
}
