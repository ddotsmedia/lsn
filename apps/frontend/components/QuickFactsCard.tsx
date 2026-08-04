import React from 'react';

export interface QuickFactsCardProps {
  icon: string;
  metric: string;
  value: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Single metric tile (ratio, class size, hours, enrichment). The metric label
 * and its value are marked up as a description list so the pairing survives
 * for screen reader users.
 */
export function QuickFactsCard({ icon, metric, value, className }: QuickFactsCardProps) {
  return (
    <div
      className={cx(
        'flex h-full flex-col rounded-lg bg-white p-6 shadow-md',
        'transition-all duration-200 ease-in-out hover:shadow-lg',
        className,
      )}
    >
      <span className="mb-3 text-3xl" aria-hidden="true">
        {icon}
      </span>
      <dl>
        <dt className="text-sm font-medium text-gray-600">{metric}</dt>
        <dd className="mt-1 text-lg font-bold text-gray-800">{value}</dd>
      </dl>
    </div>
  );
}

export default QuickFactsCard;
