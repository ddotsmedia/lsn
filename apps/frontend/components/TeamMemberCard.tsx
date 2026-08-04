import React from 'react';

export interface TeamMemberCardProps {
  name: string;
  position: string;
  bio: string;
  /** Photo URL. When omitted the card renders an initials avatar instead. */
  image?: string;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * First letter of the first and last name parts, e.g. "Sarah Ahmed" -> "SA".
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

export function TeamMemberCard({ name, position, bio, image, className }: TeamMemberCardProps) {
  const initials = getInitials(name);

  return (
    <article
      className={cx(
        'flex h-full flex-col items-center rounded-lg bg-white p-6 text-center shadow-md md:p-8',
        'transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl',
        className,
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- photos are plain
        // static assets; next/image adds no benefit until they are optimised.
        <img
          src={image}
          alt={`${name}, ${position}`}
          width={200}
          height={200}
          className="mb-5 h-50 w-50 rounded-full object-cover"
        />
      ) : (
        <div
          className="mb-5 flex h-50 w-50 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200"
          role="img"
          aria-label={`${name}, ${position}`}
        >
          <span className="text-4xl font-bold text-blue-800" aria-hidden="true">
            {initials}
          </span>
        </div>
      )}

      <h3 className="text-xl font-bold text-gray-800">{name}</h3>
      <p className="mt-1 text-base text-gray-600 md:text-lg">{position}</p>
      <p className="mt-3 text-sm leading-relaxed text-gray-700">{bio}</p>
    </article>
  );
}

export default TeamMemberCard;
