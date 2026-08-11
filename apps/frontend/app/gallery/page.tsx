'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Modal } from '@/components/Modal';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string;
  description?: string | null;
  alt_text?: string | null;
  category_name?: string | null;
  category_slug?: string | null;
  is_featured: boolean;
}

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  image_count: number;
}

interface YoutubeVideo {
  id: string;
  title: string;
  description: string | null;
  youtube_id: string;
  thumbnail_url: string | null;
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [playing, setPlaying] = useState<YoutubeVideo | null>(null);

  useEffect(() => {
    fetch(`${API}/youtube-videos`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: YoutubeVideo[]) => setVideos(Array.isArray(d) ? d : []))
      .catch(() => setVideos([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/gallery/categories`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: GalleryCategory[]) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  const load = useCallback(async (slug: string) => {
    setLoading(true);
    setError(false);
    try {
      const url = slug === 'all' ? `${API}/gallery` : `${API}/gallery?category=${slug}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: GalleryImage[] = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(active);
  }, [active, load]);

  const current = openIndex === null ? null : (images[openIndex] ?? null);
  const step = (delta: number): void =>
    setOpenIndex((i) => (i === null || images.length === 0 ? i : (i + delta + images.length) % images.length));

  // Arrow keys move through the lightbox; Modal already handles Escape.
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, images.length]);

  const filters = [{ slug: 'all', name: 'All photos' }, ...categories];

  return (
    <>
      <Header />
      <main className="bg-white">
        <section
          aria-labelledby="gallery-hero"
          className="bg-gradient-to-br from-blue-800 to-blue-500 px-4 py-12 text-center md:py-16"
        >
          <h1 id="gallery-hero" className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Gallery
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-blue-50 md:text-lg">
            A look inside our rooms, our garden and our busiest days.
          </p>
        </section>

        <section aria-labelledby="gallery-heading" className="py-10 md:py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <h2 id="gallery-heading" className="sr-only">
              Photo gallery
            </h2>

            {categories.length > 0 && (
              <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
                <div role="tablist" aria-label="Filter by category" className="flex gap-2">
                  {filters.map((c) => {
                    const selected = active === c.slug;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        role="tab"
                        aria-selected={selected}
                        onClick={() => setActive(c.slug)}
                        className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 ${
                          selected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-lg bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-center">
                <p className="text-sm text-amber-800">We couldn&rsquo;t load the gallery.</p>
                <button
                  type="button"
                  onClick={() => void load(active)}
                  className="mt-3 min-h-11 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
                >
                  Try again
                </button>
              </div>
            ) : images.length === 0 ? (
              <p className="py-12 text-center text-base text-gray-600">
                No photos here yet — check back soon.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {images.map((img, i) => (
                  <li key={img.id}>
                    <button
                      type="button"
                      onClick={() => setOpenIndex(i)}
                      aria-label={`Open ${img.title}`}
                      className="group relative block w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800 focus-visible:ring-offset-2"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={img.alt_text || img.title}
                        loading="lazy"
                        className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left text-xs font-medium text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                        {img.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {videos.length > 0 && (
          <section aria-labelledby="videos-heading" className="bg-gray-100 py-10 md:py-16">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <h2
                id="videos-heading"
                className="mb-2 text-center text-2xl font-bold text-gray-800 md:text-3xl"
              >
                Videos
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-center text-base text-gray-600">
                A closer look at life at Little Smarties.
              </p>

              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setPlaying(v)}
                      aria-label={`Play ${v.title}`}
                      className="group block w-full overflow-hidden rounded-lg bg-white text-left shadow-md transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
                    >
                      <span className="relative block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.thumbnail_url || `https://img.youtube.com/vi/${v.youtube_id}/hqdefault.jpg`}
                          alt=""
                          loading="lazy"
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/40">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
                            <svg width={22} height={22} viewBox="0 0 24 24" fill="white" aria-hidden="true">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </span>
                      </span>
                      <span className="block p-4">
                        <span className="block font-bold text-gray-800">{v.title}</span>
                        {v.description && (
                          <span className="mt-1 line-clamp-2 block text-sm text-gray-600">
                            {v.description}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
      <Footer />

      <Modal
        isOpen={playing !== null}
        onClose={() => setPlaying(null)}
        title={playing?.title ?? ''}
        size="lg"
      >
        {playing && (
          <div>
            {/* Loaded only once the modal opens, so no YouTube request is made
                until a visitor actually asks to watch something. */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.youtube_id}?autoplay=1&rel=0`}
                title={playing.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
            {playing.description && (
              <p className="mt-4 text-base leading-relaxed text-gray-700">{playing.description}</p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={current !== null}
        onClose={() => setOpenIndex(null)}
        title={current?.title ?? ''}
        size="lg"
      >
        {current && (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image_url}
              alt={current.alt_text || current.title}
              className="max-h-[60vh] w-full rounded-lg object-contain"
            />
            {current.category_name && (
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-red-600">
                {current.category_name}
              </p>
            )}
            {current.description && (
              <p className="mt-2 text-base leading-relaxed text-gray-700">{current.description}</p>
            )}

            {images.length > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  ← Previous
                </button>
                <span className="text-sm text-gray-600">
                  {(openIndex ?? 0) + 1} of {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
