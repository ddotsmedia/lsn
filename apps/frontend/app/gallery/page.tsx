'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface GalleryImage {
  id: string;
  image_url: string;
  title: string;
  description?: string;
  category_name: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGallery() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/gallery`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setImages(Array.isArray(data) ? data : []);
      } catch {
        setError('Unable to load gallery');
      } finally {
        setLoading(false);
      }
    }
    fetchGallery();
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-gray-900">Gallery</h1>

          {loading && <div className="text-center text-gray-500">Loading gallery...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map(image => (
                <div key={image.id} className="group overflow-hidden rounded-lg">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    loading="lazy"
                    className="w-full h-64 object-cover group-hover:scale-105 transition"
                  />
                  <div className="bg-gray-50 p-4">
                    <p className="text-xs text-blue-500 font-bold mb-1">{image.category_name}</p>
                    <h3 className="font-bold text-gray-900">{image.title}</h3>
                    {image.description && <p className="text-sm text-gray-600">{image.description}</p>}
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
