'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-500">
          Little Smarties
        </Link>

        <button
          type="button"
          className="sm:hidden text-gray-900"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className={`${menuOpen ? 'block' : 'hidden'} sm:flex absolute sm:static top-16 left-0 right-0 sm:top-auto sm:left-auto sm:right-auto flex-col sm:flex-row bg-white sm:bg-transparent border-b sm:border-b-0 gap-4 p-4 sm:p-0`}>
          <Link href="/" className="text-gray-900 hover:text-blue-500 font-semibold">Home</Link>
          <Link href="/about" className="text-gray-900 hover:text-blue-500 font-semibold">About</Link>
          <Link href="/facilities" className="text-gray-900 hover:text-blue-500 font-semibold">Facilities</Link>
          <Link href="/gallery" className="text-gray-900 hover:text-blue-500 font-semibold">Gallery</Link>
          <Link href="/events" className="text-gray-900 hover:text-blue-500 font-semibold">Events</Link>
          <Link href="/contact" className="text-gray-900 hover:text-blue-500 font-semibold">Contact</Link>
          <Link href="/register" className="bg-blue-500 text-white px-4 py-2 rounded font-bold hover:bg-blue-600">Register</Link>
          <Link href="/booking" className="bg-green-500 text-white px-4 py-2 rounded font-bold hover:bg-green-600">Book Tour</Link>
        </div>
      </nav>
    </header>
  );
}
