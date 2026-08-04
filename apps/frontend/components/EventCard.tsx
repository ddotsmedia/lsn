'use client';

import React from 'react';
import { Button } from './Button';
import { CategoryBadge, type EventCategory } from './CategoryBadge';

export interface EventItem {
  id: number;
  /** ISO calendar date, YYYY-MM-DD. */
  date: string;
  /** 24h start/end, used to build the human-readable line. */
  startTime: string;
  endTime: string;
  title: string;
  emoji: string;
  category: EventCategory;
  description: string;
  fullDescription: string;
  location: string;
  ageGroups: string;
  activities: readonly string[];
  isPast?: boolean;
  /** Tailwind gradient for the placeholder image. */
  gradient: string;
}

export interface EventCardProps {
  event: EventItem;
  onLearnMore: () => void;
  className?: string;
}

const cx = (...classes: Array<string | false | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Builds a Date from the calendar parts rather than parsing the ISO string,
 * which would be read as UTC midnight and can slip a day either side of the
 * date line. Constructing locally keeps the rendered day stable everywhere,
 * so the server and client markup always agree.
 */
export function parseEventDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

export function getDayNumber(iso: string): string {
  return String(parseEventDate(iso).getDate());
}

export function getMonthAbbreviation(iso: string): string {
  return parseEventDate(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function formatTime(time24: string): string {
  const [hourPart, minutePart] = time24.split(':');
  const hour = Number(hourPart ?? 0);
  const minute = minutePart ?? '00';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${suffix}`;
}

/**
 * "Friday, January 15, 2027 | 10:00 AM - 12:00 PM". Derived from the date so
 * the weekday can never drift out of sync with the calendar date.
 */
export function formatEventDateTime(event: EventItem): string {
  const formattedDate = parseEventDate(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${formattedDate} | ${formatTime(event.startTime)} - ${formatTime(event.endTime)}`;
}

/** Day/month tile shown in the corner of a card and at the top of the modal. */
export function DateBadge({ date, large = false }: { date: string; large?: boolean }) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-lg bg-red-600 text-white',
        large ? 'h-20 w-20' : 'h-16 w-16',
      )}
    >
      <span className={cx('font-bold leading-none', large ? 'text-3xl' : 'text-2xl')}>
        {getDayNumber(date)}
      </span>
      <span className={cx('mt-1 font-semibold leading-none', large ? 'text-sm' : 'text-xs')}>
        {getMonthAbbreviation(date)}
      </span>
    </div>
  );
}

/**
 * Event summary tile. As with the facility cards, the whole article is
 * clickable for pointer users while the button stays the single focusable
 * control — its click bubbles up, so each input path fires the handler once.
 */
export function EventCard({ event, onLearnMore, className }: EventCardProps) {
  const isPast = event.isPast ?? false;

  return (
    <article
      onClick={onLearnMore}
      className={cx(
        'relative flex h-full cursor-pointer flex-col rounded-lg bg-white p-6 shadow-md',
        'transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg',
        'focus-within:ring-2 focus-within:ring-blue-800 focus-within:ring-offset-2',
        className,
      )}
    >
      {/* Date badge, pinned to the card corner */}
      <div className="absolute right-4 top-4 z-10">
        <DateBadge date={event.date} />
      </div>

      {/* Placeholder image */}
      <div
        className={cx(
          'mb-4 flex aspect-3/2 w-full items-center justify-center rounded-lg bg-gradient-to-br',
          event.gradient,
          isPast && 'grayscale',
        )}
        role="img"
        aria-label={event.title}
      >
        <span className="text-5xl" aria-hidden="true">
          {event.emoji}
        </span>
      </div>

      {isPast && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Event completed
        </p>
      )}

      {/* The badge floats over the image above, so the title has the full width */}
      <h3 className="mb-2 text-xl font-bold text-gray-800 md:text-2xl">{event.title}</h3>

      <div className="mb-3">
        <CategoryBadge category={event.category} />
      </div>

      <p className="mb-5 text-sm leading-relaxed text-gray-700">{event.description}</p>

      <div className="mt-auto">
        <Button
          variant="secondary"
          size="sm"
          ariaLabel={`${isPast ? 'View photos from' : 'Learn more about'} ${event.title}`}
        >
          {isPast ? 'View Photos' : 'Learn More'}
        </Button>
      </div>
    </article>
  );
}

export default EventCard;
