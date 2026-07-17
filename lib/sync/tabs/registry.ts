/**
 * Tab handler registry.
 *
 * M-CMS-1 ships this registry empty — per-tab handlers land in M-CMS-2
 * (Content batch 1: Home, Website Settings, Navigation, Footer, FAQ, Help)
 * onward. The worker consults this registry when it claims a job; if no
 * handler is registered for the tab, the worker records the job as
 * `succeeded` with zero rows read/written and logs a
 * `no_handler_registered` note. This lets M-CMS-1 be verified end-to-end
 * — the queue works, jobs flow, audit fires — before any tab is wired up.
 */

import type { TabHandler } from "../types";

const REGISTRY: Map<string, TabHandler> = new Map();

/**
 * Register a tab handler. Called from `lib/sync/tabs/<tab>.ts` at
 * module-load time via a re-export from `lib/sync/tabs/index.ts`.
 */
export function registerHandler(handler: TabHandler): void {
  if (REGISTRY.has(handler.tabName)) {
    throw new Error(
      `Duplicate tab handler registration for "${handler.tabName}"`
    );
  }
  REGISTRY.set(handler.tabName, handler);
}

export function getHandler(tabName: string): TabHandler | null {
  return REGISTRY.get(tabName) ?? null;
}

export function listRegisteredTabs(): string[] {
  return Array.from(REGISTRY.keys()).sort();
}
