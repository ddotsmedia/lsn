'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Facility {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  location: string;
}

export default function Facilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/facilities`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : []);
      } catch {
        setError('Unable to load facilities');
      } finally {
        setLoading(false);
      }
    }
    fetchFacilities();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-gray-900">Our Facilities</h1>

          {loading && <div className="text-center text-gray-500">Loading facilities...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {facilities.map(facility => (
                <div key={facility.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-xl transition">
                  {facility.image_url && (
                    <img src={facility.image_url} alt={facility.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">{facility.name}</h2>
                    <p className="text-gray-700 mb-4">{facility.description}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <span className="mr-2">📍</span> {facility.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
