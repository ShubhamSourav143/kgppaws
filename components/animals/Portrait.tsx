import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Animal } from "@/types";

/** Photos per card story — the CSS timing in globals.css is built for three. */
export const STORY_SHOTS = 3;

/**
 * Illustrated animal portrait — KGP PAWS' cohesive visual identity for
 * animals until real photography is uploaded through the CMS. Every
 * portrait wears the PAWS collar with its QR tag.
 *
 * When `photoUrl` is supplied (a real uploaded cover photo), it renders
 * instead of the illustration, inside the same sized/rounded container so
 * callers don't need separate layout logic for the two cases.
 */
export function AnimalPortrait({
  animal,
  idle = false,
  frame = "rounded",
  className,
  photoUrl,
  photos,
}: {
  animal: Pick<Animal, "name" | "species" | "portrait">;
  /** enable subtle blink/head-tilt idle animation */
  idle?: boolean;
  frame?: "rounded" | "arch";
  className?: string;
  photoUrl?: string;
  /**
   * Opt-in: pass three photos to render an auto-advancing story instead of a
   * single still — 5s each, progress bars on top, paused while hovered.
   * Anything other than exactly three falls back to the single-photo frame.
   */
  photos?: { src: string; alt: string }[];
}) {
  const p = animal.portrait;
  const isCat = animal.species === "cat";

  if (photos && photos.length === STORY_SHOTS) {
    return (
      <div
        className={cn(
          "card-stories relative overflow-hidden",
          frame === "arch" ? "rounded-b-3xl rounded-t-[999px]" : "rounded-3xl",
          className
        )}
      >
        {photos.map((photo) => (
          <div key={photo.src} className="card-stories__shot absolute inset-0">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 28rem, 90vw"
              className="object-cover"
            />
          </div>
        ))}

        {/* scrim so the ivory bars stay legible over pale photos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-night/45 to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex gap-1.5 p-2.5"
        >
          {photos.map((photo) => (
            <span
              key={photo.src}
              className="card-stories__track h-[3px] flex-1 overflow-hidden rounded-full bg-ivory/35"
            >
              <span className="card-stories__fill block h-full w-full origin-left rounded-full bg-ivory" />
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (photoUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden",
          frame === "arch" ? "rounded-b-3xl rounded-t-[999px]" : "rounded-3xl",
          className
        )}
      >
        <Image
          src={photoUrl}
          alt={`Photo of ${animal.name}`}
          fill
          sizes="(min-width: 1024px) 28rem, 90vw"
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grain relative overflow-hidden",
        frame === "arch" ? "rounded-b-3xl rounded-t-[999px]" : "rounded-3xl",
        className
      )}
      style={{ background: `linear-gradient(160deg, ${p.from}, ${p.to})` }}
    >
      <svg
        viewBox="0 0 200 210"
        role="img"
        aria-label={`Illustrated portrait of ${animal.name}`}
        className="block h-full w-full"
      >
        {/* halo */}
        <circle cx="100" cy="112" r="72" fill="#ffffff" opacity="0.14" />

        {/* chest / body */}
        <ellipse cx="100" cy="216" rx="74" ry="62" fill={p.coat} />
        <ellipse cx="100" cy="222" rx="46" ry="48" fill={p.muzzle} opacity="0.9" />

        {/* collar with QR tag */}
        <path
          d="M42 175 Q100 200 158 175"
          stroke="#C96745"
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="100" cy="189" r="4" fill="#E8C77D" />
        <g className={idle ? "anim-swing" : undefined} style={{ transformBox: "fill-box" }}>
          <rect x="93" y="191" width="14" height="16" rx="3.5" fill="#FCF8F0" />
          <rect x="96" y="194" width="3.2" height="3.2" fill="#173F35" />
          <rect x="101" y="194" width="3.2" height="3.2" fill="#173F35" />
          <rect x="96" y="199" width="3.2" height="3.2" fill="#173F35" />
          <rect x="101" y="199" width="8" height="3.2" rx="1" fill="#C96745" opacity="0" />
          <rect x="101" y="199" width="3.2" height="3.2" fill="#C96745" />
        </g>

        {/* head group */}
        <g className={idle ? "anim-head" : undefined} style={{ transformBox: "fill-box" }}>
          {/* ears */}
          {p.ear === "floppy" && (
            <>
              <g className={idle ? "anim-ear" : undefined} style={{ transformBox: "fill-box", transformOrigin: "70% 20%" }}>
                <ellipse cx="55" cy="92" rx="17" ry="32" fill={p.coatDark} transform="rotate(16 55 92)" />
              </g>
              <ellipse cx="145" cy="92" rx="17" ry="32" fill={p.coatDark} transform="rotate(-16 145 92)" />
            </>
          )}
          {p.ear === "pointed" && (
            <>
              <g className={idle ? "anim-ear" : undefined} style={{ transformBox: "fill-box", transformOrigin: "60% 90%" }}>
                <path d="M52 88 L60 34 L92 64 Z" fill={p.coatDark} />
                <path d="M60 76 L64 48 L82 64 Z" fill={p.muzzle} opacity="0.75" />
              </g>
              <path d="M148 88 L140 34 L108 64 Z" fill={p.coatDark} />
              <path d="M140 76 L136 48 L118 64 Z" fill={p.muzzle} opacity="0.75" />
            </>
          )}
          {p.ear === "half" && (
            <>
              <g className={idle ? "anim-ear" : undefined} style={{ transformBox: "fill-box", transformOrigin: "60% 90%" }}>
                <path d="M52 90 L58 40 L90 64 Z" fill={p.coatDark} />
                <path d="M58 40 L78 44 L72 58 Z" fill={p.coat} />
              </g>
              <path d="M148 90 L142 40 L110 64 Z" fill={p.coatDark} />
              <path d="M142 40 L122 44 L128 58 Z" fill={p.coat} />
            </>
          )}

          {/* head */}
          <ellipse cx="100" cy="112" rx="52" ry="48" fill={p.coat} />

          {/* markings */}
          {p.patch === "left-eye" && (
            <circle cx="80" cy="104" r="17" fill={p.patchColor ?? p.coatDark} opacity="0.85" />
          )}
          {p.patch === "right-eye" && (
            <circle cx="120" cy="104" r="17" fill={p.patchColor ?? p.coatDark} opacity="0.85" />
          )}
          {p.patch === "blaze" && (
            <path
              d="M92 66 Q100 60 108 66 L106 118 Q100 124 94 118 Z"
              fill={p.patchColor ?? p.muzzle}
              opacity="0.9"
            />
          )}

          {/* muzzle */}
          <ellipse cx="100" cy="136" rx="25" ry="18" fill={p.muzzle} />

          {/* eyes */}
          <g className={idle ? "anim-blink" : undefined} style={{ transformBox: "fill-box" }}>
            <ellipse cx="81" cy="106" rx="5.6" ry="6.6" fill="#202421" />
            <ellipse cx="119" cy="106" rx="5.6" ry="6.6" fill="#202421" />
            <circle cx="83" cy="103.5" r="1.9" fill="#FCF8F0" />
            <circle cx="121" cy="103.5" r="1.9" fill="#FCF8F0" />
          </g>

          {/* nose */}
          <path
            d="M93 128 L107 128 Q109.4 128 107.8 130.8 L102.3 138.6 Q100 141.6 97.7 138.6 L92.2 130.8 Q90.6 128 93 128 Z"
            fill="#202421"
          />

          {/* mouth */}
          {isCat ? (
            <g stroke="#202421" strokeWidth="1.8" strokeLinecap="round" fill="none">
              <path d="M100 141 v3" />
              <path d="M100 144 q-4.5 4.5 -9 1" />
              <path d="M100 144 q4.5 4.5 9 1" />
              {/* whiskers */}
              <g opacity="0.75">
                <path d="M72 130 h-17" />
                <path d="M73 137 l-16 4" />
                <path d="M128 130 h17" />
                <path d="M127 137 l16 4" />
              </g>
            </g>
          ) : (
            <g stroke="#202421" strokeWidth="2" strokeLinecap="round" fill="none">
              <path d="M100 141 v4" />
              <path d="M100 145 q-6 6 -12 2" />
              <path d="M100 145 q6 6 12 2" />
            </g>
          )}

          {p.tongue && (
            <path
              d="M94 148 q6 -2 12 0 q0 10 -6 10 q-6 0 -6 -10 Z"
              fill="#E2917B"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
