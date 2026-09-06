import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NoteMart | Student Handwritten Notes Marketplace',
  description: 'Share Notes. Learn Better. Earn Together. Discover high quality handwritten college study notes, preview sample pages, buy, or upload your own notes to earn passive income.',
  keywords: ['handwritten notes', 'college notes', 'engineering notes', 'university study notes', 'sell notes online', 'buy pdf notes', 'IIT Bombay notes', 'VTU notes', 'DU notes'],
  authors: [{ name: 'NoteMart Team' }],
  openGraph: {
    title: 'NoteMart - Handwritten Notes Marketplace for Students',
    description: 'Find, buy, preview and sell handwritten university study notes in PDF format.',
    url: 'https://notemart.edu',
    siteName: 'NoteMart',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoteMart | Student Handwritten Notes Marketplace',
    description: 'Find, buy, preview and sell handwritten university study notes in PDF format.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
