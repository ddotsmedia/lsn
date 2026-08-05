import React from 'react';

/**
 * Decorative SVGs used as background accents across the site.
 *
 * All shapes paint with `currentColor`, so colour is set with a text utility
 * (`text-red-600`, `text-blue-800`, …) and opacity with `opacity-*` or a colour
 * slash modifier. Default sizes are set with `width`/`height` attributes rather
 * than classes, so any class passed via `className` overrides them cleanly.
 *
 * Each is `aria-hidden` — they carry no meaning for screen readers.
 */
export interface DecorationProps {
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Floating butterfly. The `animate-float` keyframes live in `app/globals.css`
 * and are disabled automatically under `prefers-reduced-motion`.
 */
export function Butterfly({ className }: DecorationProps) {
  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('animate-float text-red-600', className)}
    >
      <g fill="currentColor">
        <path d="M38 40C38 40 24 20 14 24C4 28 8 44 20 46C28 47.3 38 40 38 40Z" opacity="0.85" />
        <path d="M42 40C42 40 56 20 66 24C76 28 72 44 60 46C52 47.3 42 40 42 40Z" opacity="0.85" />
        <path d="M38 41C38 41 26 54 30 62C34 70 44 66 42 56C41.2 51.6 38 41 38 41Z" opacity="0.6" />
        <path d="M42 41C42 41 54 54 50 62C46 70 36 66 38 56C38.8 51.6 42 41 42 41Z" opacity="0.6" />
      </g>
      <ellipse cx="40" cy="42" rx="2.6" ry="12" className="fill-gray-800" />
      <circle cx="40" cy="29" r="3.2" className="fill-gray-800" />
      <path
        d="M38 26C36 21 33 19 30 18M42 26C44 21 47 19 50 18"
        className="stroke-gray-800"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Flower({ className }: DecorationProps) {
  return (
    <svg
      width={60}
      height={60}
      viewBox="0 0 60 60"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('text-red-600', className)}
    >
      <g fill="currentColor" opacity="0.9">
        <ellipse cx="30" cy="15" rx="9" ry="12" />
        <ellipse cx="30" cy="45" rx="9" ry="12" />
        <ellipse cx="15" cy="30" rx="12" ry="9" />
        <ellipse cx="45" cy="30" rx="12" ry="9" />
      </g>
      <circle cx="30" cy="30" r="8" className="fill-yellow-400" />
      <circle cx="30" cy="30" r="4" className="fill-yellow-500" opacity="0.7" />
    </svg>
  );
}

/** Faint outline-only flower doodle, used as background texture (not a solid icon). */
export function FlowerOutline({ className }: DecorationProps) {
  return (
    <svg
      width={70}
      height={110}
      viewBox="0 0 70 110"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('text-gray-300', className)}
    >
      <path d="M35 108V46" stroke="currentColor" strokeWidth="1.5" />
      <path d="M35 70C28 66 22 68 18 74" stroke="currentColor" strokeWidth="1.5" />
      <path d="M35 82C42 78 48 80 52 86" stroke="currentColor" strokeWidth="1.5" />
      <g stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="35" cy="16" rx="10" ry="14" />
        <ellipse cx="35" cy="16" rx="10" ry="14" transform="rotate(72 35 16)" />
        <ellipse cx="35" cy="16" rx="10" ry="14" transform="rotate(144 35 16)" />
        <ellipse cx="35" cy="16" rx="10" ry="14" transform="rotate(216 35 16)" />
        <ellipse cx="35" cy="16" rx="10" ry="14" transform="rotate(288 35 16)" />
      </g>
      <circle cx="35" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Small hand-drawn paper airplane, used as a scattered accent. */
export function PaperAirplane({ className }: DecorationProps) {
  return (
    <svg
      width={64}
      height={64}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('text-purple-400', className)}
    >
      <path
        d="M6 30L58 8L40 58L30 38L6 30Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path d="M30 38L58 8L18 46" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function Cloud({ className }: DecorationProps) {
  return (
    <svg
      width={120}
      height={70}
      viewBox="0 0 120 70"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('text-blue-500', className)}
    >
      <path
        d="M28 56C15.85 56 6 46.6 6 35C6 23.4 15.85 14 28 14C30.7 14 33.3 14.46 35.7 15.3C40.3 7.5 49.1 2 59.5 2C73.6 2 85.3 12.2 87.4 25.5C88.6 25.17 89.9 25 91.2 25C102.1 25 111 33.4 111 43.8C111 50.5 106.5 56 100.6 56H28Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M28 56C15.85 56 6 46.6 6 35C6 23.4 15.85 14 28 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function Circle({ className }: DecorationProps) {
  return (
    <svg
      width={100}
      height={100}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('text-blue-800', className)}
    >
      <circle cx="50" cy="50" r="46" fill="currentColor" opacity="0.15" />
      <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="3" opacity="0.45" />
      <circle cx="50" cy="50" r="16" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/**
 * Full-bleed section divider. `preserveAspectRatio="none"` lets the wave
 * stretch to any container width while keeping its 80px height.
 */
export function WavyDivider({ className }: DecorationProps) {
  return (
    <svg
      width="100%"
      height={80}
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('block w-full text-gray-100', className)}
    >
      <path
        d="M0 40C120 12 240 12 360 32C480 52 600 76 720 72C840 68 960 36 1080 24C1200 12 1320 20 1440 36V80H0V40Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Scalloped "cloud edge" mask — a row of overlapping semicircle bumps.
 * Used under the hero photo/banner to create the soft, cut-paper cloud
 * border seen throughout the brand's illustration style.
 */
export function CloudScallop({ className }: DecorationProps) {
  return (
    <svg
      width="100%"
      height={64}
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cx('block w-full text-white', className)}
    >
      <path
        d="M0,24 A90,24 0 0,0 180,24 A90,24 0 0,0 360,24 A90,24 0 0,0 540,24 A90,24 0 0,0 720,24 A90,24 0 0,0 900,24 A90,24 0 0,0 1080,24 A90,24 0 0,0 1260,24 A90,24 0 0,0 1440,24 L1440,64 L0,64 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SpeechBubble({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('relative', className)}>
      <div className="relative rounded-2xl bg-red-600 px-6 py-4 text-white">
        <div className="absolute -bottom-3 left-6 h-0 w-0 border-l-8 border-r-0 border-t-8 border-l-transparent border-t-red-600" />
        {children}
      </div>
    </div>
  );
}
