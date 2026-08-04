import React from 'react';

export type MissionCardTitle = 'Mission' | 'Vision' | 'Values';
export type MissionCardColor = 'red' | 'blue' | 'green';

export interface MissionCardProps {
  icon: string;
  title: MissionCardTitle;
  content: string;
  color: MissionCardColor;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Tailwind resolves class names statically, so the colour variants have to be
 * spelled out in a lookup rather than interpolated from the `color` prop.
 */
const COLOR_CLASSES: Record<MissionCardColor, { surface: string; accent: string }> = {
  red: { surface: 'bg-red-50 border-red-100', accent: 'text-red-600' },
  blue: { surface: 'bg-blue-50 border-blue-100', accent: 'text-blue-800' },
  green: { surface: 'bg-green-50 border-green-100', accent: 'text-green-700' },
};

export function MissionCard({ icon, title, content, color, className }: MissionCardProps) {
  const palette = COLOR_CLASSES[color];

  return (
    <article
      className={cx(
        'flex h-full flex-col items-center rounded-lg border p-6 text-center shadow-md',
        'transition-all duration-200 ease-in-out hover:shadow-lg',
        palette.surface,
        className,
      )}
    >
      <span className="mb-4 text-4xl md:text-5xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className={cx('mb-3 text-xl font-bold md:text-2xl', palette.accent)}>{title}</h3>
      <p className="text-base leading-relaxed text-gray-700">{content}</p>
    </article>
  );
}

export default MissionCard;
