'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const RegisterSchema = z.object({
  first_name: z.string().min(2, 'First name required'),
  last_name: z.string().min(2, 'Last name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  age_group_id: z.string().min(1, 'Age group required'),
});

type RegisterForm = z.infer<typeof RegisterSchema>;

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema),
  });

  async function onSubmit(data: RegisterForm) {
    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Registration failed');
      setSubmitted(true);
    } catch {
      setError('Failed to register. Please try again.');
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center text-gray-900">Register Your Child</h1>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-semibold">Registration successful! We&apos;ll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

              <div>
                <label htmlFor="first_name" className="block text-sm font-semibold mb-2 text-gray-900">First Name</label>
                <input id="first_name" {...register('first_name')} className="w-full px-4 py-2 border border-gray-300 rounded" placeholder="First name" />
                {errors.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-semibold mb-2 text-gray-900">Last Name</label>
                <input id="last_name" {...register('last_name')} className="w-full px-4 py-2 border border-gray-300 rounded" placeholder="Last name" />
                {errors.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>}
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
                <label htmlFor="age_group_id" className="block text-sm font-semibold mb-2 text-gray-900">Age Group</label>
                <select id="age_group_id" {...register('age_group_id')} className="w-full px-4 py-2 border border-gray-300 rounded">
                  <option value="">Select age group</option>
                  <option value="1">18 months - 2 years</option>
                  <option value="2">2 - 3 years</option>
                  <option value="3">3 - 4 years</option>
                  <option value="4">4 - 5 years</option>
                </select>
                {errors.age_group_id && <p className="text-red-500 text-sm mt-1">{errors.age_group_id.message}</p>}
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white py-3 rounded font-bold hover:bg-blue-600 disabled:opacity-50">
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
