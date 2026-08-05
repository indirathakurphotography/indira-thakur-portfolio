import type { Metadata } from 'next';
import { Playfair_Display, Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import ServerDataProvider from '@/components/layout/ServerDataProvider';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://indirathakurphotography.com'),
  title: {
    default: 'Indira Thakur Photography | Capturing Life\'s Precious Moments',
    template: '%s | Indira Thakur Photography',
  },
  description: 'Professional photographer specializing in newborn, maternity, portrait, and event photography. Based in Mumbai, India.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Indira Thakur Photography',
    url: 'https://indirathakurphotography.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Indira Thakur Photography',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log('[RootLayout] render');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Indira Thakur Photography',
    image: 'https://indirathakurphotography.com/og-image.jpg',
    email: 'photography@indirathakur.com',
    telephone: '+919819620484',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mumbai',
      addressCountry: 'IN',
    },
    description: 'Professional photographer specializing in newborn, maternity, portrait, and event photography. Based in Mumbai, India.',
    url: 'https://indirathakurphotography.com',
    sameAs: [
      'https://instagram.com',
    ],
  };
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="bg-ivory text-rich-black font-sans antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ServerDataProvider>{children}</ServerDataProvider>
      </body>
    </html>
  );
}