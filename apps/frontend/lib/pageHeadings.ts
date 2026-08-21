'use client';

import { useEffect, useState } from 'react';

/**
 * Reads the H1 each page renders, editable from the admin panel.
 *
 * Every caller passes the text that used to be hardcoded as `fallback`, and
 * that is what renders until the request resolves. Two reasons: the heading is
 * the largest thing on the page, so an empty string would flash and shift the
 * layout on every load; and the statically prerendered HTML keeps a real H1 for
 * crawlers instead of shipping a blank hero.
 *
 * Fails quiet, like the media hooks — a heading that cannot be fetched leaves
 * the built-in text in place rather than blanking the page.
 */

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Headings change rarely and are read on nearly every page, so a resolved slug
 * is kept for the life of the tab. `inflight` collapses the duplicate requests
 * that would otherwise fire when two components on one page share a slug.
 */
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

interface HeadingResponse {
  page_slug: string;
  heading_text: string | null;
  updated_at: string | null;
}

function fetchHeading(slug: string): Promise<string | null> {
  const pending = inflight.get(slug);
  if (pending) return pending;

  const request = fetch(`${API}/page-headings/${slug}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('failed'))))
    .then((data: HeadingResponse) => {
      const text = typeof data?.heading_text === 'string' ? data.heading_text.trim() : '';
      if (!text) return null;
      cache.set(slug, text);
      return text;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(slug);
    });

  inflight.set(slug, request);
  return request;
}

/**
 * @param slug  page key, matching the slugs in migration 028 (home, contact, …)
 * @param fallback  the heading to show until — or unless — one is fetched
 */
export function usePageHeading(slug: string, fallback: string): string {
  const [heading, setHeading] = useState<string>(() => cache.get(slug) ?? fallback);

  useEffect(() => {
    const cached = cache.get(slug);
    if (cached) {
      setHeading(cached);
      return;
    }

    let cancelled = false;
    void fetchHeading(slug).then((text) => {
      if (!cancelled && text) setHeading(text);
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return heading;
}

/** Clears the cache. Exported for the admin editor to call after saving. */
export function clearPageHeadingCache(slug?: string): void {
  if (slug) cache.delete(slug);
  else cache.clear();
}
