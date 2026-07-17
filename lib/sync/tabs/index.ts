/**
 * Central import point for tab handlers. Each side-imports its module, whose
 * top-level `registerHandler(…)` call adds it to the registry. The worker
 * imports this module once so registrations happen exactly once per process.
 */

// Content tabs (M-CMS-2)
import "./home";
import "./navigation";
import "./footer";
import "./faq";
import "./help";
import "./website-settings";
// M-CMS-3 content/master-data tabs
import "./dogs";
import "./medical-history";
import "./vaccination";
import "./sterilization";
import "./stories";
import "./events";
import "./volunteers";
import "./adoption";
import "./donate";

export { getHandler, listRegisteredTabs } from "./registry";
