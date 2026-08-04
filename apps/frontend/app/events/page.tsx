'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/Button';
import { EventCard, type EventItem } from '@/components/EventCard';
import { EventModal } from '@/components/EventModal';
import { Butterfly, Flower } from '@/components/Decorations';

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/*                                                                             */
/* Sample content. The nursery's real events live in the `news_events` table    */
/* and are served by /api/v1/events, but that schema has no category, location, */
/* age-group or activity fields, so this richer view is static for now.         */
/* Dates below are placeholders — replace them with the real schedule.          */
/* -------------------------------------------------------------------------- */

const UPCOMING_EVENTS: readonly EventItem[] = [
  {
    id: 1,
    date: '2027-01-15',
    startTime: '10:00',
    endTime: '12:00',
    title: 'Monthly Celebration Day',
    emoji: '🎉',
    category: 'Celebration',
    description:
      'A fun-filled day celebrating our community with games, music, and special activities for all age groups.',
    fullDescription:
      "Join us for our Monthly Celebration Day! This is a special occasion where all our age groups come together for fun activities, music performances, and games. Parents are welcome to join in the festivities. We'll have special snacks, performances by the children, and a photo opportunity to celebrate our Little Smarties family.",
    location: 'Little Smarties Nursery, Main Hall',
    ageGroups: 'All age groups',
    activities: [
      'Music performances',
      'Games and activities',
      'Special snacks',
      'Photo opportunities',
      'Parent participation',
    ],
    gradient: 'from-red-100 to-orange-100',
  },
  {
    id: 2,
    date: '2027-01-22',
    startTime: '09:30',
    endTime: '11:30',
    title: 'Science Discovery Workshop',
    emoji: '🔬',
    category: 'Workshop',
    description:
      'Hands-on science exploration where children conduct simple experiments and learn about the natural world.',
    fullDescription:
      'Our Science Discovery Workshop is designed to spark curiosity and wonder about the natural world. Children will conduct safe, age-appropriate experiments, observe living things, and explore scientific concepts through play-based learning. Topics include color mixing, bubbles, magnetism, and nature exploration.',
    location: 'Science Exploration Center',
    ageGroups: 'Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes, Cuddly Camels',
    activities: [
      'Experiment stations',
      'Observation activities',
      'Nature exploration',
      'Discovery journals',
      'Group discussions',
    ],
    gradient: 'from-blue-100 to-cyan-100',
  },
  {
    id: 3,
    date: '2027-02-05',
    startTime: '14:00',
    endTime: '16:00',
    title: "Children's Art Exhibition",
    emoji: '🎨',
    category: 'Exhibition',
    description:
      'Showcase of children’s artwork throughout the year with guided tours and artist meet-and-greet.',
    fullDescription:
      'Celebrate our young artists! This exhibition features a beautiful collection of artwork created by our children throughout the year. From paintings to sculptures, collages to mixed media, each piece tells a story of creativity and growth. Parents can take guided tours, meet the young artists, and purchase prints or unique pieces as keepsakes.',
    location: 'Little Smarties Nursery, Gallery Space',
    ageGroups: 'All age groups',
    activities: [
      'Gallery viewing',
      'Artist meet-and-greet',
      'Creative activities',
      'Art supplies',
      'Light refreshments',
    ],
    gradient: 'from-pink-100 to-purple-100',
  },
  {
    id: 4,
    date: '2027-02-14',
    startTime: '09:00',
    endTime: '11:30',
    title: 'Little Smarties Sports Day',
    emoji: '⚽',
    category: 'Sports',
    description:
      'Fun outdoor sports activities, races, and games for all age groups with a focus on participation and fun.',
    fullDescription:
      'Get ready for a day of fun and movement! Our Sports Day features age-appropriate games, races, and activities designed to build physical fitness, confidence, and team spirit. Events include running races, obstacle courses, ball games, relay races, and cooperative activities. All children participate, and parents are invited to cheer and join in select activities.',
    location: 'Outdoor Play Area',
    ageGroups: 'Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes, Cuddly Camels',
    activities: [
      'Running races',
      'Obstacle courses',
      'Ball games',
      'Relay races',
      'Cooperative games',
    ],
    gradient: 'from-amber-100 to-orange-100',
  },
  {
    id: 5,
    date: '2027-03-05',
    startTime: '15:00',
    endTime: '16:30',
    title: 'Spring Music Recital',
    emoji: '🎵',
    category: 'Performance',
    description:
      'Children showcase musical talents with songs, instrument performances, and group singing.',
    fullDescription:
      "Experience the joy of music as our children perform in our Spring Music Recital. From solo performances to group singing, instrumental solos to ensemble pieces, watch as our young musicians share what they've learned. This is a wonderful opportunity to celebrate their musical growth and confidence.",
    location: 'Multi-Purpose Hall',
    ageGroups: 'All age groups',
    activities: [
      'Solo performances',
      'Group singing',
      'Instrument showcase',
      'Ensemble pieces',
      'Recognition ceremony',
    ],
    gradient: 'from-violet-100 to-purple-100',
  },
  {
    id: 6,
    date: '2027-03-13',
    startTime: '09:00',
    endTime: '13:00',
    title: 'Parent-Teacher Conferences',
    emoji: '👥',
    category: 'Meeting',
    description:
      "One-on-one discussions about your child's growth, development, and experiences at Little Smarties.",
    fullDescription:
      "Join us for Parent-Teacher Conferences where we share observations about your child's growth and development. We'll discuss their learning progress, social-emotional development, interests, and any questions you may have. These conversations are valuable for creating a strong home-school partnership.",
    location: 'Conference Room',
    ageGroups: 'All age groups',
    activities: [
      'Individual conferences',
      'Growth portfolio review',
      'Discussion of milestones',
      'Goal setting',
      'Home-school collaboration',
    ],
    gradient: 'from-cyan-100 to-blue-100',
  },
  {
    id: 7,
    date: '2027-03-24',
    startTime: '08:30',
    endTime: '12:30',
    title: 'Nature Center Field Trip',
    emoji: '🌿',
    category: 'Learning',
    description:
      'Outdoor exploration at a nature center with guided activities and discovery learning.',
    fullDescription:
      "Take a journey into nature! We're visiting the local nature center for an outdoor adventure filled with exploration, discovery, and fun. Children will observe wildlife, learn about ecosystems, explore different habitats, and participate in nature-based activities. This is an exciting way to connect learning with the natural world.",
    location: 'Local Nature Center',
    ageGroups: 'Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes, Cuddly Camels',
    activities: [
      'Wildlife observation',
      'Habitat exploration',
      'Nature scavenger hunt',
      'Guided nature walks',
      'Discovery activities',
    ],
    gradient: 'from-green-100 to-emerald-100',
  },
  {
    id: 8,
    date: '2027-04-09',
    startTime: '14:00',
    endTime: '17:00',
    title: 'End of Year Celebration Party',
    emoji: '🎊',
    category: 'Celebration',
    description:
      'Grand celebration of the year with performances, games, food, and memories of wonderful moments.',
    fullDescription:
      "Join us for our End of Year Celebration! This special day marks the completion of an amazing year at Little Smarties. We'll celebrate with performances, games, special food, photo slideshow of favorite moments, and recognition of our growing learners. It's a day to reflect on growth, celebrate friendships, and look forward to next year.",
    location: 'Little Smarties Nursery',
    ageGroups: 'All age groups',
    activities: [
      'Children performances',
      'Games and activities',
      'Special meal',
      'Photo slideshow',
      'Award presentations',
    ],
    gradient: 'from-red-100 to-pink-100',
  },
];

const PAST_EVENTS: readonly EventItem[] = [
  {
    id: 101,
    date: '2026-06-12',
    startTime: '09:00',
    endTime: '12:00',
    title: 'Graduation Day',
    emoji: '🎓',
    category: 'Celebration',
    description:
      'Our Fuzzy Foxes and Cuddly Camels marked the end of their nursery years before moving on to school.',
    fullDescription:
      'A morning of certificates, songs and more than a few proud tears as our oldest groups said goodbye. Each child received a portfolio of their work from the year, and families stayed on afterwards for refreshments in the garden.',
    location: 'Multi-Purpose Hall',
    ageGroups: 'Fuzzy Foxes, Cuddly Camels',
    activities: [
      'Certificate ceremony',
      'Group performances',
      'Portfolio handover',
      'Family refreshments',
      'Class photographs',
    ],
    isPast: true,
    gradient: 'from-amber-100 to-yellow-100',
  },
  {
    id: 102,
    date: '2026-05-20',
    startTime: '10:00',
    endTime: '11:30',
    title: 'World Food Day',
    emoji: '🍲',
    category: 'Celebration',
    description:
      'Families brought a dish from home and the children tasted their way around the world in one morning.',
    fullDescription:
      'One of our best-attended events of the year. Families contributed dishes from their own kitchens, and the children spent the morning tasting, comparing and asking questions about where each dish came from. Recipe cards were shared with everyone afterwards.',
    location: 'Cafeteria',
    ageGroups: 'All age groups',
    activities: [
      'Family recipe stalls',
      'Guided tasting',
      'Map and flag activity',
      'Recipe card exchange',
      'Group storytelling',
    ],
    isPast: true,
    gradient: 'from-orange-100 to-red-100',
  },
  {
    id: 103,
    date: '2026-04-16',
    startTime: '09:30',
    endTime: '11:00',
    title: 'Spring Planting Morning',
    emoji: '🌱',
    category: 'Learning',
    description:
      'Every group planted something in the garden beds and took a seedling of their own home.',
    fullDescription:
      'The children prepared the beds, sowed seeds and labelled their own rows. Much of what went in that morning has since been harvested and eaten at lunch, which turned out to be the most convincing gardening lesson of all.',
    location: 'Outdoor Play Area',
    ageGroups: 'All age groups',
    activities: [
      'Bed preparation',
      'Seed sowing',
      'Labelling and charting',
      'Take-home seedlings',
      'Watering rota setup',
    ],
    isPast: true,
    gradient: 'from-green-100 to-lime-100',
  },
  {
    id: 104,
    date: '2026-03-06',
    startTime: '14:00',
    endTime: '15:30',
    title: 'Storytelling Afternoon',
    emoji: '📖',
    category: 'Performance',
    description:
      'Parents and grandparents came in to read aloud, several in languages other than English.',
    fullDescription:
      'Families volunteered to read to small groups, and we heard stories in six languages over the course of the afternoon. The children moved between reading corners in rotation, and the books stayed in the library for the following month.',
    location: 'Library Corner',
    ageGroups: 'All age groups',
    activities: [
      'Rotating reading corners',
      'Multilingual read-alouds',
      'Puppet retellings',
      'Book borrowing',
      'Illustration activity',
    ],
    isPast: true,
    gradient: 'from-blue-100 to-indigo-100',
  },
  {
    id: 105,
    date: '2026-02-11',
    startTime: '09:00',
    endTime: '11:00',
    title: 'Community Helpers Day',
    emoji: '🚒',
    category: 'Learning',
    description:
      'Visitors from the local fire service and a paediatric nurse spent the morning with us.',
    fullDescription:
      'A firefighter, a nurse and a postal worker visited to talk about their jobs and answer questions. The fire engine in the car park was, predictably, the highlight. Children tried on equipment and practised what to do in an emergency.',
    location: 'Outdoor Play Area',
    ageGroups: 'Gentle Giraffes, Dazzling Dolphins, Fuzzy Foxes, Cuddly Camels',
    activities: [
      'Visitor talks',
      'Fire engine tour',
      'Dress-up and role play',
      'Emergency practice',
      'Thank-you card making',
    ],
    isPast: true,
    gradient: 'from-red-100 to-rose-100',
  },
  {
    id: 106,
    date: '2025-12-18',
    startTime: '15:00',
    endTime: '17:00',
    title: 'Winter Family Evening',
    emoji: '❄️',
    category: 'Celebration',
    description:
      'An after-hours evening of lanterns, songs and warm drinks to close out the winter term.',
    fullDescription:
      'The children made lanterns during the week and carried them around the garden at dusk while the choir sang. It was the first year we ran this event in the evening rather than the afternoon, and it is now firmly part of the calendar.',
    location: 'Little Smarties Nursery',
    ageGroups: 'All age groups',
    activities: [
      'Lantern making',
      'Evening garden walk',
      'Group singing',
      'Warm drinks and snacks',
      'Family photographs',
    ],
    isPast: true,
    gradient: 'from-sky-100 to-blue-100',
  },
];

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const NEWSLETTER_TIMEOUT_MS = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [email, setEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const closeModal = useCallback(() => setSelectedEvent(null), []);

  const handleSubscribe = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }

    // No newsletter backend exists yet — this only acknowledges the sender.
    setNewsletterError(null);
    setEmail('');
    setIsSubscribed(true);

    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setIsSubscribed(false);
      timeoutRef.current = null;
    }, NEWSLETTER_TIMEOUT_MS);
  };

  return (
    <>
      <Header />

      <main className="bg-white">
        {/* ---------------------------------------------------------------- */}
        {/* 1. Hero                                                          */}
        {/* ---------------------------------------------------------------- */}
        <section
          aria-labelledby="hero-heading"
          className="relative flex min-h-62.5 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-500 to-red-600 px-4 lg:min-h-100"
        >
          <Butterfly className="absolute left-[8%] top-[20%] w-14 text-white opacity-20 lg:w-20" />
          <Flower className="absolute right-[10%] bottom-[22%] w-12 text-white opacity-20 lg:w-20" />

          <div className="relative z-10 mx-auto max-w-3xl py-12 text-center">
            <h1
              id="hero-heading"
              className="text-3xl font-bold text-white drop-shadow-md md:text-4xl lg:text-5xl"
            >
              Events &amp; Programs
            </h1>
            <p className="mt-4 text-lg text-blue-50 drop-shadow md:text-xl">
              Join us for exciting learning experiences
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 2. Upcoming events                                               */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="upcoming-heading" className="bg-white py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
            <h2
              id="upcoming-heading"
              className="mb-4 text-center text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl"
            >
              Upcoming Events
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-base text-gray-600 md:mb-12 md:text-lg">
              Select any event for full details, timings and what your child will be doing.
            </p>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {UPCOMING_EVENTS.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onLearnMore={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 4. Past events                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section aria-labelledby="past-heading" className="bg-gray-100 py-20 md:py-32">
          <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8">
            <h2
              id="past-heading"
              className="mb-4 text-center text-2xl font-bold text-gray-800 md:text-3xl lg:text-4xl"
            >
              Past Events
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-center text-base text-gray-600 md:mb-12 md:text-lg">
              A look back at what we have been up to.
            </p>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
              {PAST_EVENTS.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onLearnMore={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* 5. Newsletter signup                                             */}
        {/* ---------------------------------------------------------------- */}
        <section
          aria-labelledby="newsletter-heading"
          className="bg-gradient-to-r from-red-600 to-orange-500 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-4 text-center md:px-6">
            <h2 id="newsletter-heading" className="text-2xl font-bold text-white md:text-3xl">
              Stay Updated on Upcoming Events!
            </h2>
            <p className="mt-4 text-base text-orange-50 md:text-lg">
              Subscribe to our newsletter for event announcements
            </p>

            {isSubscribed ? (
              <div
                role="status"
                className="mx-auto mt-8 max-w-md rounded-lg border border-green-400 bg-green-50 p-4"
              >
                <p className="font-semibold text-green-800">Thank you! Check your inbox.</p>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                noValidate
                className="mx-auto mt-8 flex max-w-lg flex-col items-stretch gap-4 sm:flex-row sm:justify-center"
              >
                <div className="flex-1 text-left">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Your email address
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(changeEvent) => {
                      setEmail(changeEvent.target.value);
                      if (newsletterError) setNewsletterError(null);
                    }}
                    aria-invalid={newsletterError ? true : undefined}
                    aria-describedby={newsletterError ? 'newsletter-error' : undefined}
                    className="w-full rounded-lg border-2 border-white bg-white p-3 text-base text-gray-800 placeholder:text-gray-400 focus:border-blue-800 focus:outline-none sm:w-75"
                  />
                  {newsletterError && (
                    <p
                      id="newsletter-error"
                      className="mt-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-red-700"
                    >
                      {newsletterError}
                    </p>
                  )}
                </div>

                <Button type="submit" variant="secondary" size="lg">
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />

      {/* ------------------------------------------------------------------ */}
      {/* 3. Event details modal                                             */}
      {/* ------------------------------------------------------------------ */}
      <EventModal isOpen={selectedEvent !== null} onClose={closeModal} event={selectedEvent} />
    </>
  );
}
