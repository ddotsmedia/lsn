'use client';

import Link from 'next/link';
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** When set, the button renders as a Next.js link styled identically. */
  href?: string;
  /** Accessible name, required when children are icon-only. */
  ariaLabel?: string;
  /** Stretch to the full width of the parent (useful for mobile CTAs). */
  fullWidth?: boolean;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Shared across every variant: mobile-first tap target, centred content and a
 * visible keyboard focus ring that does not rely on the default UA outline.
 */
const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-center ' +
  'transition-all duration-200 ease-in-out select-none ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md ' +
    'active:bg-red-800 focus-visible:ring-red-600',
  secondary:
    'bg-blue-800 text-white shadow-sm hover:bg-blue-900 hover:shadow-md ' +
    'active:bg-blue-950 focus-visible:ring-blue-800',
  outline:
    'border-2 border-blue-800 bg-transparent text-blue-800 ' +
    'hover:bg-blue-800 hover:text-white active:bg-blue-900 focus-visible:ring-blue-800',
  ghost:
    'bg-transparent text-gray-800 hover:bg-gray-100 active:bg-gray-200 ' +
    'focus-visible:ring-gray-400',
};

/** Every size clears the 44px minimum tap target recommended for touch. */
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-4 py-2 text-sm',
  md: 'min-h-12 px-5 py-2.5 text-base',
  lg: 'min-h-13 px-7 py-3 text-base md:text-lg',
};

const DISABLED_CLASSES =
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ' +
  'disabled:hover:shadow-none';

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  className,
  disabled = false,
  type = 'button',
  href,
  ariaLabel,
  fullWidth = false,
}: ButtonProps) {
  const classes = cx(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className,
  );

  // A disabled link is not focusable or announceable as disabled, so fall back
  // to a real disabled button rather than rendering an inert anchor.
  if (href && !disabled) {
    return (
      <Link href={href} className={classes} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(classes, DISABLED_CLASSES)}
    >
      {children}
    </button>
  );
}

export default Button;
