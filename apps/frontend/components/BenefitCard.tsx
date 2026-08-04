import React from 'react';

export interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

export function BenefitCard({ icon, title, description, className }: BenefitCardProps) {
  return (
    <article
      className={cx(
        'flex h-full flex-col rounded-lg bg-white p-6 shadow-md md:p-8',
        'transition-shadow duration-200 ease-in-out hover:shadow-lg',
        className,
      )}
    >
      <span className="mb-4 text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mb-3 text-xl font-bold text-gray-800 md:text-2xl">{title}</h3>
      <p className="text-base leading-relaxed text-gray-700">{description}</p>
    </article>
  );
}

export default BenefitCard;
