'use client';

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Lift the card on hover/focus. Implied when `onClick` is provided. */
  hoverable?: boolean;
  onClick?: () => void;
  /** Adds a subtle scale on hover. Only applies when the card is hoverable. */
  scaleOnHover?: boolean;
  /** Accessible name, used when the card itself is the interactive element. */
  ariaLabel?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

const BASE_CLASSES =
  'bg-white rounded-lg shadow-md p-4 md:p-6 lg:p-8 ' +
  'transition-all duration-200 ease-in-out';

const HOVER_CLASSES = 'hover:shadow-lg';

const INTERACTIVE_CLASSES =
  'cursor-pointer text-left w-full focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2';

/**
 * Generic content wrapper. Renders a plain `div` for static content and a
 * semantic `button` when `onClick` is supplied, so keyboard activation and
 * focus handling come from the platform rather than hand-rolled key handlers.
 */
export function Card({
  children,
  className,
  hoverable = false,
  onClick,
  scaleOnHover = false,
  ariaLabel,
}: CardProps) {
  const isInteractive = typeof onClick === 'function';
  const liftsOnHover = hoverable || isInteractive;

  const classes = cx(
    BASE_CLASSES,
    liftsOnHover && HOVER_CLASSES,
    liftsOnHover && scaleOnHover && 'hover:scale-105',
    isInteractive && INTERACTIVE_CLASSES,
    className,
  );

  if (isInteractive) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} className={classes}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

export default Card;
