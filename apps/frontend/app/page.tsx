'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroRotator, { HeroSlide } from '@/components/HeroRotator';
import {
  Butterfly,
  Flower,
  FlowerOutline,
  PaperAirplane,
  CloudScallop,
} from '@/components/Decorations';

interface AgeGroup {
  name: string;
  ageRange: string;
  description: string;
  icon: string;
  experiences: string[];
}

interface Testimonial {
  quote: string;
  author: string;
}

/**
 * Real copy pulled directly from the live production site
 * (littlesmartiesnursery.com) on 2026-08-05, so wording and program
 * names match what visitors already know.
 */
const ageGroups: AgeGroup[] = [
  {
    name: 'Bouncing Bunnies',
    ageRange: '0 - 1 year',
    description:
      'A warm, nurturing start for our tiniest learners with lots of cuddles, sensory play, and support.',
    icon: '🐰',
    experiences: [
      'Gentle care & feeding routines',
      'Tummy time and soft play',
      'Responsive caregiving',
      'Soothing music and bonding',
      'Safe, cozy spaces',
    ],
  },
  {
    name: 'Precious Pandas',
    ageRange: '1 - 2 years',
    description: 'Encouraging curiosity and independence in early walkers through playful learning.',
    icon: '🐼',
    experiences: [
      'Hands-on discovery play',
      'Language development support',
      'Sensory and motor activities',
      'Encouraging self-feeding',
      'Outdoor exploration',
    ],
  },
  {
    name: 'Gentle Giraffes',
    ageRange: '2 - 3 years',
    description: 'Developing communication and social-emotional skills through structured play.',
    icon: '🦒',
    experiences: [
      'Circle time and storytelling',
      'Creative expression activities',
      'Fine motor skills practice',
      'Peer interaction',
      'Simple routines and structure',
    ],
  },
  {
    name: 'Dazzling Dolphins',
    ageRange: '3 - 4 years',
    description: 'Fostering confidence, imagination, and cognitive growth in a vibrant environment.',
    icon: '🐬',
    experiences: [
      'Phonics and early math',
      'Role play and drama',
      'Group projects and sharing',
      'Outdoor learning zones',
      'Building self-esteem',
    ],
  },
  {
    name: 'Fuzzy Foxes',
    ageRange: '4 - 5 years',
    description: 'Ready for school with structured curriculum and focus on independence.',
    icon: '🦊',
    experiences: [
      'Reading and number concepts',
      'Problem-solving and logic',
      'Teamwork and leadership',
      'Creative arts and music',
      'Pre-school assessments',
    ],
  },
  {
    name: 'Cuddly Camel',
    ageRange: '4 - 5 years',
    description:
      'Supportive learning for confident, curious learners preparing to transition to primary school.',
    icon: '🐫',
    experiences: [
      'Advanced literacy and numeracy',
      'Personal and social skills',
      'Learning through inquiry',
      'Confidence-building tasks',
      'Smooth transition preparation',
    ],
  },
];

/** Real reviews as published on the live site. */
const testimonials: Testimonial[] = [
  {
    quote:
      'My son absolutely loved it here! The principal was kind and inspiring, and the teachers were loving and caring. Thank you Little Smarties for setting the perfect foundation for our children.',
    author: 'Al Salam St, Abu Dhabi',
  },
  {
    quote:
      'The kindest staff and great attention to small details and hygiene. My little girl loves it! I especially love how they engage the kids in Arabic culture and language through their curriculum.',
    author: 'Hasnaa Bahajjoub',
  },
  {
    quote:
      'The nursery exceeded all of my expectations. The staff is friendly, knowledgeable, and the facility is clean and well maintained. I highly recommend it to anyone.',
    author: 'Nuha Mohammed Abujame',
  },
  {
    quote: 'One of the best nurseries in terms of care and education. The location is awesome!',
    author: 'Fatma Ali',
  },
];

const partners = ['Partner One', 'Partner Two', 'Partner Three', 'Partner Four', 'Partner Five', 'Partner Six'];

/**
 * Real photos pulled from littlesmartiesnursery.com's own hero rotator,
 * shown with the same technique the live site uses: setInterval + Tailwind
 * opacity crossfade (see HeroRotator.tsx), no carousel library.
 */
const HERO_SLIDES: HeroSlide[] = [
  { src: '/images/hero-1.png', alt: 'Little Smarties Nursery event' },
  { src: '/images/hero-2.jpeg', alt: 'Children celebrating UAE National Day' },
  { src: '/images/hero-3.png', alt: 'Outdoor garden learning at Little Smarties' },
  { src: '/images/hero-4.png', alt: 'Little Smarties Nursery outdoor activities' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [testimonialStart, setTestimonialStart] = useState(0);
  const activeGroup = ageGroups[activeTab];

  const visibleTestimonials = [0, 1, 2].map(
    (offset) => testimonials[(testimonialStart + offset) % testimonials.length]
  );

  return (
    <>
      <Header />

      <main className="overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* Hero                                                              */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-blue-900">
          <HeroRotator slides={HERO_SLIDES} intervalMs={6000} />
          <div className="pointer-events-none absolute inset-0 bg-black/25" />
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute left-[10%] top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
            <div className="absolute right-[16%] top-16 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-16 left-[30%] h-20 w-20 rounded-full bg-white/10 blur-xl" />
          </div>

          <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-4 py-24 text-center sm:min-h-[480px] sm:py-28">
            <h1 className="font-display text-5xl leading-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
              Welcome to
              <br />
              Little Smarties Nursery
            </h1>
            <Link href="/nursery" className="mt-8">
              <button className="h-12 rounded-full bg-red-600 px-8 font-bold text-white shadow-lg transition-transform hover:scale-105 sm:h-14 sm:px-10">
                Explore Now
              </button>
            </Link>
          </div>

          <CloudScallop className="relative text-white" />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Intro                                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-28">
          <FlowerOutline className="pointer-events-none absolute right-[6%] top-10 hidden w-16 opacity-40 sm:block" />
          <FlowerOutline className="pointer-events-none absolute -bottom-4 right-[22%] hidden w-12 rotate-12 opacity-30 sm:block" />
          <Butterfly className="pointer-events-none absolute bottom-10 left-[6%] w-14 opacity-80 sm:w-16" />
          <PaperAirplane className="pointer-events-none absolute right-[8%] top-8 w-12 -rotate-12 opacity-70 sm:w-14" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl">
                <span className="text-red-600">Little Smarties</span> Early Learning Centre
              </h2>
              <p className="mt-5 leading-relaxed text-gray-600">
                Little Smarties Nursery was founded in 2007 and has since then been committed to
                providing the highest international standards of child care. LSN has been
                identified by ADEK as nursery with a high level of compliance and academic
                quality.
              </p>
              <Link href="/nursery" className="mt-7 inline-block">
                <button className="h-12 rounded-full bg-red-600 px-7 font-bold text-white shadow-md transition-transform hover:scale-105">
                  Read More →
                </button>
              </Link>
            </div>

            <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
              <div className="absolute -left-6 -top-6 h-16 w-16 rounded-full bg-red-500/30" />
              <div className="absolute -bottom-6 -right-4 h-20 w-20 rounded-full bg-blue-500/30" />
              <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 via-white to-amber-50 shadow-xl">
                <div className="text-center">
                  <div className="text-6xl">🧩</div>
                  <p className="mt-2 text-sm font-semibold text-blue-800">Photo placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Age Groups — tabbed selector                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-28">
          <FlowerOutline className="pointer-events-none absolute left-[3%] top-24 hidden w-20 opacity-30 lg:block" />
          <FlowerOutline className="pointer-events-none absolute right-[3%] top-10 hidden w-20 rotate-6 opacity-30 lg:block" />
          <PaperAirplane className="pointer-events-none absolute right-[12%] top-6 w-14 rotate-12 opacity-60" />
          <Butterfly className="pointer-events-none absolute left-[4%] top-16 w-14 opacity-70" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-4xl text-red-600 sm:text-5xl">Our Age Groups</h2>
              <p className="mt-3 text-gray-500">
                Tailored programs for every stage of your child&apos;s development journey
              </p>
            </div>

            {/* Tab bar */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {ageGroups.map((group, idx) => {
                const isActive = idx === activeTab;
                return (
                  <button
                    key={group.name}
                    onClick={() => setActiveTab(idx)}
                    className={`rounded-lg border px-4 py-2.5 text-center text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-red-600 bg-red-600 text-white shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-200'
                    }`}
                  >
                    <div>{group.name}</div>
                    <div className={`text-[11px] font-normal ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                      {group.ageRange}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:items-start">
              <div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-3xl">
                  {activeGroup.icon}
                </div>
                <h3 className="mt-5 font-display text-3xl text-gray-900">{activeGroup.name}</h3>
                <p className="mt-4 text-gray-600">{activeGroup.description}</p>

                <ul className="mt-5 space-y-2.5">
                  {activeGroup.experiences.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-gray-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-100 to-amber-50 shadow-lg">
                <div className="flex h-full items-center justify-center text-6xl">
                  {activeGroup.icon}
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                  {activeGroup.ageRange}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Testimonials                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-white py-20 sm:py-28">
          <div className="pointer-events-none absolute left-[6%] top-16 h-4 w-4 rounded-full bg-amber-300" />
          <div className="pointer-events-none absolute right-[10%] top-24 h-3 w-3 rounded-full bg-blue-300" />
          <div className="pointer-events-none absolute bottom-24 left-[14%] h-3 w-3 rounded-full bg-pink-300" />
          <div className="pointer-events-none absolute bottom-16 right-[8%] h-4 w-4 rounded-full bg-green-300" />

          <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl leading-tight text-red-600 sm:text-5xl">
              Our Parents Are
              <br />
              Our True Ambassadors!
            </h2>
            <p className="mt-3 text-gray-500">
              Hear from families who have experienced the Little Smarties difference
            </p>

            <div className="mt-12 flex items-center justify-center gap-3 sm:gap-6">
              <button
                aria-label="Previous slide"
                onClick={() =>
                  setTestimonialStart((i) => (i === 0 ? testimonials.length - 1 : i - 1))
                }
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-red-600 hover:text-red-600"
              >
                ‹
              </button>

              <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-3">
                {visibleTestimonials.map((t, idx) => (
                  <div
                    key={`${t.author}-${idx}`}
                    className="relative rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm"
                  >
                    <div className="mb-2 text-amber-400">★★★★★</div>
                    <p className="text-sm italic leading-relaxed text-gray-600">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <p className="mt-4 text-sm font-bold text-gray-900">{t.author}</p>
                  </div>
                ))}
              </div>

              <button
                aria-label="Next slide"
                onClick={() => setTestimonialStart((i) => (i + 1) % testimonials.length)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-red-600 hover:text-red-600"
              >
                ›
              </button>
            </div>

            <p className="mt-10 text-sm font-semibold text-gray-700">
              Join our community of happy families!
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Partners                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="bg-white pb-20 sm:pb-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl text-red-600 sm:text-5xl">Our Partners</h2>
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {partners.map((name) => (
                <div
                  key={name}
                  className="flex h-16 items-center justify-center rounded-xl bg-gray-200"
                  aria-label={name}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
