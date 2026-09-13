import type { ReactNode } from "react";

/**
 * Soft entrance on every route change — the whole page rises into place.
 *
 * A template re-mounts on every navigation, which is what restarts the
 * animation. The motion itself is a CSS keyframe (`.anim-page-enter` in
 * globals.css) rather than framer-motion: this file used to be a client
 * component rendering `<motion.div initial={{opacity: 0, y: 16}}>`, and
 * because the initial style is server-rendered, every page shipped as
 * `<div style="opacity:0;transform:translateY(16px)">` — invisible until React
 * hydrated. See the comment on the keyframe for the full reasoning.
 *
 * Now a server component: no client JS, no hydration dependency, and reduced
 * motion is handled by the media query instead of a JS hook.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="anim-page-enter">{children}</div>;
}
