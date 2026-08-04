'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-gray-900">About Little Smarties</h1>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                To provide a nurturing, safe, and stimulating environment where every child can grow, learn, and thrive. We believe in fostering curiosity, creativity, and a love of learning in all our students.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">
                To be the leading nursery in the region, known for our commitment to excellence, innovation in early childhood education, and the positive impact we have on every child and family we serve.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Values</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3">✓</span>
                  <span>Child-Centered Learning: Every child is unique and special</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3">✓</span>
                  <span>Safety &amp; Wellbeing: Creating a secure environment for growth</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3">✓</span>
                  <span>Quality Education: Evidence-based teaching methods</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-3">✓</span>
                  <span>Community Partnership: Working closely with families</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
