import Link from "next/link";
import { ArrowUpRight, Camera } from "lucide-react";
import { SmartImage } from "@/components/media/SmartImage";
import { Reveal, Stagger, Item } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import type { MediaAsset } from "@/lib/media";

export interface GalleryPreviewPhoto {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

/** Masonry teaser for /gallery — only renders when real photography exists. */
export function GalleryPreview({
  media,
  cmsPhotos = [],
}: {
  media: MediaAsset[];
  cmsPhotos?: GalleryPreviewPhoto[];
}) {
  const photos: GalleryPreviewPhoto[] = [...media, ...cmsPhotos].slice(0, 7);
  if (photos.length < 3) return null;

  return (
    <section aria-labelledby="gallery-h" className="overflow-hidden bg-parchment py-24 sm:py-32">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <Reveal effect="fade">
              <p className="eyebrow mb-5 inline-flex items-center gap-2 text-saffron-deep">
                <Camera className="h-4 w-4" aria-hidden="true" />
                From the field
              </p>
            </Reveal>
            <TextReveal
              as="h2"
              text="Life on four paws, photographed."
              className="font-display text-3xl font-bold leading-tight text-forest-deep sm:text-4xl lg:text-5xl"
            />
          </div>
          <Reveal>
            <Link
              href="/gallery"
              className="group inline-flex items-center gap-2 rounded-full border-2 border-forest px-6 py-3 text-sm font-bold text-forest transition-colors hover:bg-forest hover:text-ivory"
            >
              Open the gallery
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </Link>
          </Reveal>
        </div>

        <Stagger className="mt-12 columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4" gap={0.06}>
          {photos.map((p) => (
            <Item key={p.src} effect="scale" className="break-inside-avoid">
              <Link href="/gallery" className="group block overflow-hidden rounded-2xl">
                <SmartImage
                  src={p.src}
                  alt={p.alt}
                  width={p.width ?? 800}
                  height={p.height ?? 1000}
                  placeholder={p.blurDataURL ? "blur" : undefined}
                  blurDataURL={p.blurDataURL}
                  sizes="(min-width: 1024px) 22rem, 45vw"
                  className="w-full"
                  imgClassName="w-full transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </Link>
            </Item>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
