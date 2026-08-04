import React from 'react';

export type EventCategory =
  | 'Workshop'
  | 'Celebration'
  | 'Learning'
  | 'Sports'
  | 'Performance'
  | 'Exhibition'
  | 'Meeting';

export interface CategoryBadgeProps {
  category: EventCategory;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Tailwind resolves class names statically, so every category tint is spelled
 * out rather than interpolated. Tints are chosen to keep text contrast well
 * clear of 4.5:1 against their own background.
 */
const CATEGORY_CLASSES: Record<EventCategory, string> = {
  Workshop: 'bg-blue-100 text-blue-800',
  Celebration: 'bg-red-100 text-red-700',
  Learning: 'bg-green-100 text-green-800',
  Sports: 'bg-amber-100 text-amber-800',
  Performance: 'bg-violet-100 text-violet-800',
  Exhibition: 'bg-pink-100 text-pink-800',
  Meeting: 'bg-cyan-100 text-cyan-800',
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        CATEGORY_CLASSES[category],
        className,
      )}
    >
      {category}
    </span>
  );
}

export default CategoryBadge;
