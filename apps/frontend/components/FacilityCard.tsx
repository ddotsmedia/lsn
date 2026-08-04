'use client';

import React from 'react';
import { Button } from './Button';

export interface FacilityCardProps {
  emoji: string;
  name: string;
  description: string;
  features: readonly string[];
  onClick: () => void;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Facility summary tile.
 *
 * The whole card is clickable for pointer users, but the only focusable control
 * is the "Learn More" button — nesting a button inside a button would be
 * invalid markup. The button deliberately has no handler of its own: its click
 * bubbles to the article, so mouse, keyboard and assistive tech all end up in
 * the same place exactly once.
 */
export function FacilityCard({
  emoji,
  name,
  description,
  features,
  onClick,
  className,
}: FacilityCardProps) {
  return (
    <article
      onClick={onClick}
      className={cx(
        'flex h-full cursor-pointer flex-col rounded-lg bg-white p-6 shadow-md',
        'transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg',
        'focus-within:ring-2 focus-within:ring-blue-800 focus-within:ring-offset-2',
        className,
      )}
    >
      <span className="mb-4 text-4xl md:text-5xl" aria-hidden="true">
        {emoji}
      </span>

      <h3 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">{name}</h3>
      <p className="mb-4 text-base text-gray-700">{description}</p>

      <ul className="mb-6 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="mt-0.5 text-blue-500" aria-hidden="true">
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Pushed to the bottom so buttons line up across a row of cards. */}
      <div className="mt-auto">
        <Button variant="secondary" size="sm" ariaLabel={`Learn more about ${name}`}>
          Learn More
        </Button>
      </div>
    </article>
  );
}

export default FacilityCard;
