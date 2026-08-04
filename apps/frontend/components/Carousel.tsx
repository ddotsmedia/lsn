'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface CarouselProps<T> {
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Show the dot indicators below the track. */
  showDots?: boolean;
  /** Advance automatically. Pauses on hover, focus and reduced-motion. */
  autoPlay?: boolean;
  /** Auto-play delay in milliseconds. */
  interval?: number;
  className?: string;
  /** Accessible name for the carousel region. */
  ariaLabel?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Scroll-snap carousel.
 *
 * The track is a native horizontally-scrolling flex row with CSS scroll
 * snapping, which gives real touch/trackpad swiping and momentum for free —
 * the buttons and dots just call `scrollTo`. Because position comes from the
 * scroll offset rather than component state, the indicators stay correct even
 * when the user swipes directly.
 */
export function Carousel<T>({
  items,
  renderItem,
  showDots = true,
  autoPlay = false,
  interval = 5000,
  className,
  ariaLabel = 'Carousel',
}: CarouselProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const count = items.length;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track || count === 0) return;
      const clamped = ((index % count) + count) % count;
      track.scrollTo({
        left: clamped * track.clientWidth,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [count, prefersReducedMotion],
  );

  const goToPrevious = useCallback(
    () => scrollToIndex(currentIndex - 1),
    [currentIndex, scrollToIndex],
  );
  const goToNext = useCallback(
    () => scrollToIndex(currentIndex + 1),
    [currentIndex, scrollToIndex],
  );

  /** Derive the active slide from the scroll offset. */
  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setCurrentIndex(Math.min(Math.max(index, 0), Math.max(count - 1, 0)));
  }, [count]);

  useEffect(() => {
    if (!autoPlay || isPaused || prefersReducedMotion || count <= 1) return;
    const timer = window.setInterval(() => scrollToIndex(currentIndex + 1), interval);
    return () => window.clearInterval(timer);
  }, [autoPlay, isPaused, prefersReducedMotion, count, currentIndex, interval, scrollToIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  };

  if (count === 0) return null;

  const arrowClasses =
    'absolute top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center ' +
    'rounded-full bg-white/70 text-gray-800 shadow-md transition-all duration-200 ease-in-out ' +
    'hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 ' +
    'focus-visible:ring-blue-800 disabled:opacity-40';

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={cx('relative w-full', className)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-live={autoPlay && !isPaused ? 'off' : 'polite'}
        className={
          'flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 ' +
          // `scrollbar-none` only emits `scrollbar-width`, which iOS Safari
          // below 18.4 ignores — the WebKit pseudo-element covers those.
          'scrollbar-none [&::-webkit-scrollbar]:hidden'
        }
      >
        {items.map((item, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            className="w-full shrink-0 snap-center"
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous slide"
            className={cx(arrowClasses, 'left-2 md:left-4')}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 5 8 12 15 19" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className={cx(arrowClasses, 'right-2 md:right-4')}
          >
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 5 16 12 9 19" />
            </svg>
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className="mt-2 flex items-center justify-center">
          {items.map((_, index) => (
            // The visible dot is small, so the button keeps a 44px tap target
            // and paints the dot with an inner span.
            <button
              key={index}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : undefined}
              className="group inline-flex h-11 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
            >
              <span
                className={cx(
                  'block h-3 rounded-full transition-all duration-200 ease-in-out',
                  index === currentIndex
                    ? 'w-6 bg-red-600'
                    : 'w-3 bg-gray-300 group-hover:bg-gray-400',
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;
