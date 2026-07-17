"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Camera } from "lucide-react";

const RealFacesScene = dynamic(() => import("./RealFacesScene"), {
  ssr: false,
  loading: () => null,
});

export interface RealFacePhoto {
  url: string;
  caption: string;
  href: string;
}

/**
 * Homepage showcase for real, non-demo photography — the only section on
 * the site with a 3D element, and only because there is now real content
 * worth presenting this way. Renders nothing if there are no real photos
 * yet (a fresh install with only the fictional demo dataset).
 *
 * The 3D scene needs WebGL and constant motion, so it's skipped entirely
 * under prefers-reduced-motion in favour of a static caption strip — the
 * captions themselves still get a GSAP ScrollTrigger horizontal scrub,
 * since that reveal is just a transform, not simulated motion.
 */
export function RealFaces({ photos }: { photos: RealFacePhoto[] }) {
  const [reduce, setReduce] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduce || !trackRef.current || !sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const track = trackRef.current;
    const scrollLength = track.scrollWidth - track.parentElement!.clientWidth;
    if (scrollLength <= 0) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: -scrollLength,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: () => `+=${scrollLength}`,
          scrub: 0.6,
          pin: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reduce, photos.length]);

  if (photos.length === 0) return null;

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-forest-deep py-20 text-cream">
      <div className="container-page">
        <p className="eyebrow mb-3 text-sand">Real photography, not illustration</p>
        <h2 className="max-w-2xl text-balance font-display text-4xl font-bold sm:text-5xl">
          Real faces on campus.
        </h2>
        <p className="mt-4 max-w-xl text-cream/75">
          Every photo here was taken by a volunteer, not generated for this
          site. Some of these animals don&apos;t have full profiles yet —
          that&apos;s the point of showing them.
        </p>
      </div>

      {!reduce && (
        <div className="relative mt-12 h-[420px] w-full">
          <RealFacesScene
            photos={photos.slice(0, 8).map((p) => ({ url: p.url, caption: p.caption }))}
          />
        </div>
      )}

      <div className="mt-10 overflow-hidden">
        <div ref={trackRef} className="flex w-max gap-6 px-[max(1.5rem,calc((100vw-72rem)/2))]">
          {photos.map((p, i) => (
            <Link
              key={p.url + i}
              href={p.href}
              className="group flex w-72 shrink-0 items-center gap-3 rounded-2xl border border-cream/15 bg-cream/5 p-4 transition-colors hover:bg-cream/10"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/10">
                <Camera className="h-4 w-4 text-sand" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-cream/90">
                  {p.caption}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-cream/40 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
