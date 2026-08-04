'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface NewsEvent {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published_at: string;
}

export default function Events() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setError('Unable to load events');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-gray-900">News &amp; Events</h1>

          {loading && <div className="text-center text-gray-500">Loading events...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="space-y-8">
              {events.map(event => (
                <article key={event.id} className="border-b pb-8 last:border-b-0">
                  {event.image_url && (
                    <img src={event.image_url} alt={event.title} loading="lazy" className="w-full h-48 object-cover rounded mb-4" />
                  )}
                  <time dateTime={event.published_at} className="text-sm text-gray-500">
                    {new Date(event.published_at).toLocaleDateString()}
                  </time>
                  <h2 className="text-2xl font-bold mt-2 mb-3 text-gray-900">{event.title}</h2>
                  <p className="text-gray-700 leading-relaxed">{event.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
