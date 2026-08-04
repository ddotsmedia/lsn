'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const BookingSchema = z.object({
  visitor_name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  preferred_date: z.string().min(1, 'Date required'),
  time_slot: z.string().min(1, 'Time slot required'),
});

type BookingForm = z.infer<typeof BookingSchema>;

export default function Booking() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<BookingForm>({
    resolver: zodResolver(BookingSchema),
  });

  const selectedDate = watch('preferred_date');

  // Keep react-hook-form's own onChange — spreading register() then overriding
  // onChange would stop the field from ever registering a value.
  const dateField = register('preferred_date');

  async function checkAvailability(date: string) {
    if (!date) {
      setAvailability([]);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tour-bookings/availability?date=${date}`);
      const data = await res.json();
      setAvailability(Array.isArray(data.available) ? data.available : []);
    } catch (err) {
      console.error('Failed to check availability:', err);
      setAvailability([]);
    }
  }

  async function onSubmit(data: BookingForm) {
    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/tour-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // The API validates preferred_date as an ISO 8601 datetime; a bare
          // YYYY-MM-DD from <input type="date"> is rejected.
          preferred_date: `${data.preferred_date}T${data.time_slot}:00.000Z`,
        }),
      });
      if (!res.ok) {
        if (res.status === 409) {
          setError('That time slot has just been taken. Please pick another.');
          return;
        }
        throw new Error('Booking failed');
      }
      setSubmitted(true);
    } catch {
      setError('Failed to book tour. Please try again.');
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center text-gray-900">Book a Tour</h1>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-semibold">Tour booking confirmed! We&apos;ll send you a confirmation email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

              <div>
                <label htmlFor="visitor_name" className="block text-sm font-semibold mb-2 text-gray-900">Your Name</label>
                <input id="visitor_name" {...register('visitor_name')} className="w-full px-4 py-2 border border-gray-300 rounded" placeholder="Name" />
                {errors.visitor_name && <p className="text-red-500 text-sm mt-1">{errors.visitor_name.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
                <input id="email" {...register('email')} type="email" className="w-full px-4 py-2 border border-gray-300 rounded" placeholder="Email" />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-gray-900">Phone</label>
                <input id="phone" {...register('phone')} type="tel" className="w-full px-4 py-2 border border-gray-300 rounded" placeholder="Phone number" />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label htmlFor="preferred_date" className="block text-sm font-semibold mb-2 text-gray-900">Preferred Date</label>
                <input
                  id="preferred_date"
                  {...dateField}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded"
                  onChange={(e) => {
                    void dateField.onChange(e);
                    void checkAvailability(e.target.value);
                  }}
                />
                {errors.preferred_date && <p className="text-red-500 text-sm mt-1">{errors.preferred_date.message}</p>}
              </div>

              {selectedDate && (
                <div>
                  <label htmlFor="time_slot" className="block text-sm font-semibold mb-2 text-gray-900">Time Slot</label>
                  <select id="time_slot" {...register('time_slot')} className="w-full px-4 py-2 border border-gray-300 rounded">
                    <option value="">Select time slot</option>
                    {availability.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                  {availability.length === 0 && (
                    <p className="text-gray-500 text-sm mt-1">No slots available on this date.</p>
                  )}
                  {errors.time_slot && <p className="text-red-500 text-sm mt-1">{errors.time_slot.message}</p>}
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 rounded font-bold hover:bg-blue-600 disabled:opacity-50">
                {isSubmitting ? 'Booking...' : 'Book Tour'}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
