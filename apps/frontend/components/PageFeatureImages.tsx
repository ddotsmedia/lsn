'use client';

import type { SiteImage } from '@/lib/media';

/**
 * The feature_1..3 images uploaded for a page, as a photo strip.
 *
 * Renders nothing while every slot is empty, so a page with no photographs
 * reads exactly as it did before. Two images lay out as a pair rather than
 * leaving a gap where the third would be.
 */
export function PageFeatureImages({
  images,
  heading,
  slots = ['feature_1', 'feature_2', 'feature_3'],
  className = 'bg-white py-16 md:py-24',
}: {
  images: Record<string, SiteImage | undefined>;
  heading?: string;
  /** Which slots to draw, so a page can spend one elsewhere. */
  slots?: readonly string[];
  /** Section wrapper classes, so a page can match its own rhythm. */
  className?: string;
}) {
  const features = slots
    .map((slot) => images[slot])
    .filter((image): image is SiteImage => Boolean(image));

  if (features.length === 0) return null;

  const columns =
    features.length === 1
      ? 'grid-cols-1'
      : features.length === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={className} aria-label={heading ?? 'Photographs'}>
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {heading && (
          <h2 className="mb-8 text-center text-2xl font-bold text-gray-800 md:text-3xl">
            {heading}
          </h2>
        )}
        <div className={`grid gap-6 ${columns}`}>
          {features.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={image.id}
              src={image.url}
              alt={image.alt_text || ''}
              loading="lazy"
              className="aspect-4/3 w-full rounded-lg object-cover shadow-md"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Wraps children in a page's uploaded background image. Without one the
 * children render inside the fallback classes instead, so the section keeps
 * whatever look it already had.
 */
export function PageBackground({
  image,
  children,
  fallbackClassName = '',
  className = '',
}: {
  image: SiteImage | null | undefined;
  children: React.ReactNode;
  fallbackClassName?: string;
  className?: string;
}) {
  if (!image) {
    return <section className={`${className} ${fallbackClassName}`}>{children}</section>;
  }

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dimmed: the text over it was written for a solid background. */}
      <div className="absolute inset-0 bg-white/85" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

export default PageFeatureImages;
