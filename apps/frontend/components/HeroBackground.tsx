'use client';

import type { SiteImage } from '@/lib/media';

/**
 * Lays an uploaded hero image behind a hero section's gradient.
 *
 * The gradient stays, dimmed, as an overlay: hero text is white, and a photo
 * alone gives no guarantee of contrast behind it. Renders nothing when no image
 * has been uploaded, so every hero keeps its original look until one is.
 *
 * The parent section must already be `relative overflow-hidden`.
 */
export function HeroBackground({ image }: { image: SiteImage | null | undefined }) {
  if (!image) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt_text || ''}
        // Decorative: the heading beside it already names the page.
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
    </>
  );
}

export default HeroBackground;
