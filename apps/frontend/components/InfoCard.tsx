import React from 'react';

export interface InfoCardProps {
  icon: string;
  title: string;
  content: readonly string[];
  linkText?: string;
  linkHref?: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

export function InfoCard({ icon, title, content, linkText, linkHref, className }: InfoCardProps) {
  // Anything pointing off-site opens in a new tab; mailto:/tel: must not.
  const isExternal = linkHref?.startsWith('http') ?? false;

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

      <div className="space-y-1">
        {content.map((line) => (
          <p key={line} className="text-base text-gray-700">
            {line}
          </p>
        ))}
      </div>

      {linkText && linkHref && (
        <a
          href={linkHref}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="mt-auto inline-flex min-h-11 items-center pt-5 text-sm font-semibold text-red-600 transition-colors duration-200 ease-in-out hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
        >
          {linkText}
          <span aria-hidden="true"> →</span>
          {isExternal && <span className="sr-only"> (opens in a new tab)</span>}
        </a>
      )}
    </article>
  );
}

export default InfoCard;
