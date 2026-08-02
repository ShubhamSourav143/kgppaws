import { SmartImage } from "@/components/media/SmartImage";
import { cn } from "@/lib/utils";
import type { SlidePhoto } from "@/components/our-work/OurWorkSlideshow";

/**
 * Fills a card's media box with a photo or, when the resolved media is a video
 * (some shelter members / work sections only have an .mp4), an autoplaying
 * muted loop — mirroring how OurWorkSlideshow handles the same media pool, so
 * a card never falls back to a broken <img>. Server-safe.
 */
export function CardMedia({
  photo,
  sizes,
  imgClassName,
}: {
  photo?: SlidePhoto;
  sizes: string;
  imgClassName?: string;
}) {
  if (!photo) return null;

  if (photo.src.endsWith(".mp4")) {
    return (
      <video
        src={photo.src}
        autoPlay
        loop
        muted
        playsInline
        aria-label={photo.alt || undefined}
        className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
      />
    );
  }

  return (
    <SmartImage
      src={photo.src}
      alt={photo.alt}
      fill
      sizes={sizes}
      placeholder={photo.blurDataURL ? "blur" : undefined}
      blurDataURL={photo.blurDataURL}
      className="h-full w-full"
      imgClassName={cn("h-full w-full object-cover", imgClassName)}
    />
  );
}
