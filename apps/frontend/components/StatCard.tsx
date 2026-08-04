import React from 'react';

export interface StatCardProps {
  number: string;
  label: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Statistic tile for the achievements band. Sized for a dark/gradient
 * background, so both the figure and the label are light on purpose.
 */
export function StatCard({ number, label, className }: StatCardProps) {
  return (
    <div className={cx('flex flex-col items-center text-center', className)}>
      <span className="text-4xl font-bold text-white md:text-5xl">{number}</span>
      <span className="mt-2 text-base text-gray-100 md:text-lg">{label}</span>
    </div>
  );
}

export default StatCard;
