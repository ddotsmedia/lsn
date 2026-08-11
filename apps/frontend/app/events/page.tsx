'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';

interface ApiEvent {
  id: string;
  title: string;
  description?: string | null;
  event_date: string | null;
  event_time: string | null;
  end_time: string | null;
  location?: string | null;
  image_url?: string | null;
  event_type: string;
  age_groups?: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL;

const TYPE_STYLES: Record<string, string> = {
  Celebration: 'bg-red-100 text-red-700',
  Workshop: 'bg-blue-100 text-blue-800',
  Learning: 'bg-green-100 text-green-800',
  Sports: 'bg-amber-100 text-amber-800',
  Performance: 'bg-violet-100 text-violet-800',
  Exhibition: 'bg-pink-100 text-pink-800',
  Meeting: 'bg-cyan-100 text-cyan-800',
  General: 'bg-gray-100 text-gray-700',
};

/** Builds the date locally so a UTC-parsed ISO string cannot slip a day. */
function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDay(iso: string | null): { day: string; month: string } {
  const date = parseDate(iso);
  if (!date) return { day: '–', month: '' };
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

function formatFull(iso: string | null): string {
  const date = parseDate(iso);
  if (!date) return 'Date to be confirmed';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, min] = time.slice(0, 5).split(':').map(Number);
  if (h === undefined || Number.isNaN(h)) return '';
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min ?? 0).padStart(2, '0')} ${suffix}`;
}

function timeRange(e: ApiEvent): string {
  const start = formatTime(e.event_time);
  const end = formatTime(e.end_time);
  if (!start) return '';
  return end ? `${start} – ${end}` : start;
}

function EventCard({ event, past, onOpen }: { event: ApiEvent; past: boolean; onOpen: () => void }) {
  const { day, month } = formatDay(event.event_date);
  return (
    <article
      onClick={onOpen}
      className="relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg bg-white shadow-md transition-all duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-800 md:hover:scale-105"
    >
      <div className="relative">
        {event.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            loading="lazy"
            className={`aspect-3/2 w-full object-cover ${past ? 'grayscale' : ''}`}
          />
        ) : (
          <div className="aspect-3/2 w-full bg-gradient-to-br from-blue-100 to-blue-200" />
        )}
        <div className="absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-red-600 text-white shadow">
          <span className="text-xl font-bold leading-none">{day}</span>
          <span className="mt-0.5 text-[10px] font-semibold leading-none">{month}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        {past && (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Event completed
          </p>
        )}
        <h3 className="mb-2 text-lg font-bold text-gray-800 md:text-xl">{event.title}</h3>
        <span
          className={`mb-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            TYPE_STYLES[event.event_type] ?? TYPE_STYLES.General
          }`}
        >
          {event.event_type}
        </span>
        {event.description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-700">
            {event.description}
          </p>
        )}
        <div className="mt-auto">
          <Button variant="secondary" size="sm" ariaLabel={`Details for ${event.title}`}>
            {past ? 'View Details' : 'Learn More'}
          </Button>
        </div>
      </div>
    </article>
  );
}

function EventGrid({
  events,
  past,
  onOpen,
}: {
  events: ApiEvent[];
  past: boolean;
  onOpen: (e: ApiEvent) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} past={past} onOpen={() => onOpen(e)} />
      ))}
    </div>
  );
}

export default function EventsPage() {
  const [upcoming, setUpcoming] = useState<ApiEvent[]>([]);
  const [past, setPast] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ApiEvent | null>(null);
  const [isPastSelected, setIsPastSelected] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [u, p] = await Promise.all([
        fetch(`${API}/events?scope=upcoming`).then((r) => (r.ok ? r.json() : Promise.reject())),
        fetch(`${API}/events?scope=past`).then((r) => (r.ok ? r.json() : Promise.reject())),
      ]);
      setUpcoming(Array.isArray(u) ? u : []);
      setPast(Array.isArray(p) ? p : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const open = (e: ApiEvent, wasPast: boolean): void => {
    setSelected(e);
    setIsPastSelected(wasPast);
  };

  return (
    <>
      <Header />
      <main className="bg-white">
        <section
          aria-labelledby="events-hero"
          className="bg-gradient-to-br from-blue-500 to-red-600 px-4 py-12 text-center md:py-16"
        >
          <h1 id="events-hero" className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Events &amp; Programs
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-blue-50 md:text-lg">
            Join us for exciting learning experiences
          </p>
        </section>

        {loading ? (
          <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          </section>
        ) : error ? (
          <section className="mx-auto max-w-xl px-4 py-16 text-center">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-5">
              <p className="text-sm text-amber-800">
                We couldn&rsquo;t load our events just now. Please try again, or call us on{' '}
                <a href="tel:+971562677747" className="font-semibold underline">
                  +971 56 267 7747
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-3 min-h-11 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Try again
              </button>
            </div>
          </section>
        ) : (
          <>
            <section aria-labelledby="upcoming-heading" className="py-12 md:py-20">
              <div className="mx-auto max-w-6xl px-4 md:px-6">
                <h2
                  id="upcoming-heading"
                  className="mb-8 text-center text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl"
                >
                  Upcoming Events
                </h2>
                {upcoming.length === 0 ? (
                  <p className="text-center text-base text-gray-600">
                    Nothing scheduled right now — check back soon.
                  </p>
                ) : (
                  <EventGrid events={upcoming} past={false} onOpen={(e) => open(e, false)} />
                )}
              </div>
            </section>

            {past.length > 0 && (
              <section aria-labelledby="past-heading" className="bg-gray-100 py-12 md:py-20">
                <div className="mx-auto max-w-6xl px-4 md:px-6">
                  <h2
                    id="past-heading"
                    className="mb-8 text-center text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl"
                  >
                    News
                  </h2>
                  <EventGrid events={past} past onOpen={(e) => open(e, true)} />
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        size="lg"
      >
        {selected && (
          <div>
            {selected.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.image_url}
                alt={selected.title}
                className={`mb-5 aspect-3/2 w-full rounded-lg object-cover ${
                  isPastSelected ? 'grayscale' : ''
                }`}
              />
            )}

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                TYPE_STYLES[selected.event_type] ?? TYPE_STYLES.General
              }`}
            >
              {selected.event_type}
            </span>

            <dl className="mt-4 space-y-2 text-base text-gray-700">
              <div className="flex gap-2">
                <dt aria-hidden="true">📅</dt>
                <dd>
                  {formatFull(selected.event_date)}
                  {timeRange(selected) && ` · ${timeRange(selected)}`}
                </dd>
              </div>
              {selected.location && (
                <div className="flex gap-2">
                  <dt aria-hidden="true">📍</dt>
                  <dd>{selected.location}</dd>
                </div>
              )}
              {selected.age_groups && (
                <div className="flex gap-2">
                  <dt aria-hidden="true">👥</dt>
                  <dd>{selected.age_groups}</dd>
                </div>
              )}
            </dl>

            {selected.description && (
              <p className="mt-5 text-base leading-relaxed text-gray-700">{selected.description}</p>
            )}

            {!isPastSelected && (
              <div className="mt-8 border-t border-gray-100 pt-5">
                <Button href="/booking" variant="primary" size="lg">
                  Book a Visit
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
