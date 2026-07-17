/**
 * Central import point for tab handlers. Handlers register themselves as a
 * side effect of being imported here. The worker imports this module once
 * so registrations happen exactly once per process.
 *
 * M-CMS-1 has no registered tabs yet — Content batch 1 lands in M-CMS-2.
 */
export { getHandler, listRegisteredTabs } from "./registry";
