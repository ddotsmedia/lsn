import React from 'react';
import type { Metadata } from 'next';
import { Caveat, Nunito } from 'next/font/google';
import './globals.css';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { WhatsAppContact } from '@/components/WhatsAppContact';

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Little Smarties Nursery',
  description: 'Quality early childhood education and care',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caveat.variable} ${nunito.variable}`}>
      <body className="bg-white text-gray-900">
        {children}
        {/*
          Both are client components. The WhatsApp button previously lived
          inline here with onMouseEnter/onMouseLeave handlers, which this file
          cannot carry: layout.tsx is a server component and event handlers are
          not allowed in one. Hover styling now comes from Tailwind instead.
        */}
        <WhatsAppContact />
        <ChatbotWidget />
      </body>
    </html>
  );
}
