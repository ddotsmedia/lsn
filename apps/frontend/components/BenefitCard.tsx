import React from 'react';
import Link from 'next/link';

export interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
  /** When set, the whole card becomes a link to this route. */
  href?: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

const BASE =
  'flex h-full flex-col rounded-lg bg-white p-6 shadow-md md:p-8 ' +
  'transition-all duration-200 ease-in-out';

export function BenefitCard({ icon, title, description, href, className }: BenefitCardProps) {
  const body = (
    <>
      <span className="mb-4 text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="mb-3 text-xl font-bold text-gray-800 md:text-2xl">{title}</h3>
      <p className="text-base leading-relaxed text-gray-700">{description}</p>
    </>
  );

  if (!href) {
    return <article className={cx(BASE, 'hover:shadow-lg', className)}>{body}</article>;
  }

  // A real anchor, so it is keyboard reachable, works with middle-click and
  // "open in new tab", and is announced as a link rather than a decorative card.
  return (
    <Link
      href={href}
      className={cx(
        BASE,
        'cursor-pointer hover:scale-[1.02] hover:shadow-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800',
        'focus-visible:ring-offset-2',
        className,
      )}
    >
      {body}
      <span className="mt-4 text-sm font-semibold text-red-600" aria-hidden="true">
        Learn more →
      </span>
    </Link>
  );
}

export default BenefitCard;
