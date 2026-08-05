'use client';

import { useEffect, useState } from 'react';

export interface HeroSlide {
  /** Real photo URL, once available. Leave undefined to fall back to `gradient`. */
  src?: string;
  /** Tailwind gradient classes used as a placeholder until real photography lands. */
  gradient?: string;
  alt: string;
}

interface HeroRotatorProps {
  slides: HeroSlide[];
  /** Milliseconds between slide changes. Matches the ~5-15s cadence seen on
   *  littlesmartiesnursery.com's live hero rotator. */
  intervalMs?: number;
  className?: string;
}

/**
 * Auto-rotating hero background, built to match the technique running on
 * littlesmartiesnursery.com today: a plain `setInterval` timer advances the
 * active slide, and Tailwind's `transition-opacity duration-700` crossfades
 * between stacked, absolutely-positioned layers. No carousel library —
 * the live site doesn't use one either (confirmed: no Swiper/Slick/Splide/
 * Glide/Embla/Keen-Slider globals present on the page).
 *
 * Swap placeholders for real photography by setting `src` on each slide
 * (e.g. `/images/hero-1.jpg`) — the `gradient` fallback then simply stops
 * being used for that slide.
 */
export default function HeroRotator({ slides, intervalMs = 6000, className }: HeroRotatorProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className={className ?? 'absolute inset-0'} aria-hidden="true">
      {slides.map((slide, i) => (
        <div
          key={slide.alt + i}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
            slide.gradient ?? ''
          } ${i === index ? 'opacity-100' : 'opacity-0'}`}
          style={slide.src ? { backgroundImage: `url(${slide.src})` } : undefined}
        />
      ))}
    </div>
  );
}
