'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Modal } from './Modal';
import { Button } from './Button';
import { CategoryBadge } from './CategoryBadge';
import { DateBadge, formatEventDateTime, type EventItem } from './EventCard';

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export function EventModal({ isOpen, onClose, event }: EventModalProps) {
  const [hasRsvped, setHasRsvped] = useState(false);

  // Reset the RSVP acknowledgement when the modal closes or another event is
  // opened, otherwise the confirmation carries over to the next event.
  useEffect(() => {
    setHasRsvped(false);
  }, [isOpen, event?.id]);

  if (!event) return null;

  const isPast = event.isPast ?? false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event.title} size="lg">
      <div className="flex items-start gap-4">
        <DateBadge date={event.date} large />
        <div className="pt-1">
          <CategoryBadge category={event.category} />
          <p className="mt-2 text-base text-gray-600 md:text-lg">{formatEventDateTime(event)}</p>
        </div>
      </div>

      {/* Placeholder image */}
      <div
        className={`mt-6 flex aspect-5/3 w-full items-center justify-center rounded-lg bg-gradient-to-br ${event.gradient} ${
          isPast ? 'grayscale' : ''
        }`}
        role="img"
        aria-label={event.title}
      >
        <span className="text-6xl md:text-7xl" aria-hidden="true">
          {event.emoji}
        </span>
      </div>

      <dl className="mt-6 space-y-3">
        <div className="flex items-start gap-2">
          <dt className="shrink-0">
            <span aria-hidden="true">📍</span>
            <span className="sr-only">Location</span>
          </dt>
          <dd className="text-base text-gray-700">{event.location}</dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="shrink-0">
            <span aria-hidden="true">👥</span>
            <span className="sr-only">Age groups</span>
          </dt>
          <dd className="text-base text-gray-700">{event.ageGroups}</dd>
        </div>
      </dl>

      <p className="mt-6 text-base leading-relaxed text-gray-700">{event.fullDescription}</p>

      <section aria-labelledby="event-activities-heading" className="mt-6">
        <h3 id="event-activities-heading" className="mb-3 text-lg font-semibold text-gray-800">
          What&rsquo;s Happening
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {event.activities.map((activity) => (
            <li key={activity} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-0.5 text-red-600" aria-hidden="true">
                •
              </span>
              <span>{activity}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 border-t border-gray-100 pt-6">
        {isPast ? (
          // A finished event cannot be attended, so the action leads to the
          // photos instead of an RSVP that would go nowhere.
          <Link
            href="/gallery"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-800 px-5 font-semibold text-white transition-all duration-200 ease-in-out hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2"
          >
            View Photos in Gallery
          </Link>
        ) : hasRsvped ? (
          <div role="status" className="rounded-lg border border-green-400 bg-green-50 p-4">
            <p className="font-semibold text-green-800">
              Thanks for your RSVP! We&rsquo;ll see you there.
            </p>
            <p className="mt-1 text-sm text-green-700">
              Nothing has been sent yet — please confirm your place with the office.
            </p>
          </div>
        ) : (
          <Button variant="primary" size="lg" onClick={() => setHasRsvped(true)}>
            RSVP for Event
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default EventModal;
