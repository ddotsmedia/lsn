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

export default function Home() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFacilities() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/facilities`);
        const data = await res.json();
        setFacilities(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch facilities:', error);
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
        {/* Hero Section */}
        <section className="w-full bg-blue-500 text-white py-16 px-4 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Little Smarties Nursery</h1>
            <p className="text-lg sm:text-xl mb-8">Nurturing young minds, building bright futures</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="bg-white text-blue-500 px-6 py-3 rounded font-bold hover:bg-gray-100">
                Register Now
              </a>
              <a href="/booking" className="bg-blue-700 text-white px-6 py-3 rounded font-bold hover:bg-blue-800">
                Book a Tour
              </a>
            </div>
          </div>
        </section>

        {/* Facilities Section */}
        <section className="py-16 px-4 sm:py-24">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-900">Our Facilities</h2>
            {loading ? (
              <div className="text-center text-gray-500">Loading facilities...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {facilities.map(facility => (
                  <div key={facility.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition">
                    {facility.image_url && (
                      <img src={facility.image_url} alt={facility.name} className="w-full h-40 object-cover rounded mb-4" />
                    )}
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{facility.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{facility.description}</p>
                    <p className="text-sm text-gray-500">📍 {facility.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
