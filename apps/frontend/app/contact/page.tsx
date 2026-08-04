'use client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Contact() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <section className="py-16 px-4 sm:py-24 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-gray-900">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Get In Touch</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="text-lg font-semibold text-gray-900">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="text-lg font-semibold text-gray-900">info@littlesmarties.com</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Address</p>
                  <p className="text-lg font-semibold text-gray-900">123 Learning Lane, Education City</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Hours</p>
                  <p className="text-lg font-semibold text-gray-900">Mon-Fri: 7:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <form className="space-y-4">
                <input type="text" name="name" aria-label="Your name" placeholder="Your Name" className="w-full px-4 py-2 border border-gray-300 rounded" />
                <input type="email" name="email" aria-label="Your email" placeholder="Your Email" className="w-full px-4 py-2 border border-gray-300 rounded" />
                <textarea name="message" aria-label="Message" placeholder="Message" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded"></textarea>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
