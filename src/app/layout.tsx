import type { Metadata } from 'next';
import { Playfair_Display, Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import ServerDataProvider from '@/components/layout/ServerDataProvider';
import { getGlobalJsonLd } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';
import MetaPixel from '@/components/analytics/MetaPixel';
import HashScrollHandler from '@/components/navigation/HashScrollHandler';
import { connectToDatabase } from '@/lib/mongodb';
import BrandSettings from '@/models/BrandSettings';
import SEO from '@/models/SEO';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const baseMetadata: Metadata = {
  metadataBase: new URL('https://www.indirathakur.com'),
  title: {
    default: 'Indira Thakur Photography | Luxury Newborn, Maternity & Portrait Photography Mumbai',
    template: '%s | Indira Thakur Photography',
  },
  description: 'Indira Thakur Photography — Premier luxury fine art photographer specializing in newborn, maternity, portrait, and wedding/event photography and films in Mumbai, India.',
  keywords: [
    'Indira Thakur',
    'Indira Thakur Photography',
    'Maternity Photographer Mumbai',
    'Newborn Photographer Mumbai',
    'Baby Photography Mumbai',
    'Fine Art Portrait Photography',
    'Wedding Photographer Mumbai',
    'Birth Photography Mumbai',
    'Luxury Photography Studio Mumbai',
  ],
  authors: [{ name: 'Indira Thakur' }],
  creator: 'Indira Thakur',
  publisher: 'Indira Thakur Photography',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://www.indirathakur.com',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Indira Thakur Photography',
    title: 'Indira Thakur Photography | Fine Art Newborn & Maternity Studio Mumbai',
    description: 'Premier luxury photographer specializing in newborn, maternity, portrait, and wedding storytelling in Mumbai, Maharashtra, India.',
    url: 'https://www.indirathakur.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Indira Thakur Photography Studio Mumbai',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indira Thakur Photography | Luxury Photography Studio Mumbai',
    description: 'Bespoke fine art photographer specializing in newborn, maternity, and portrait photography in Mumbai.',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDatabase();
    const brand = await BrandSettings.findOne().lean();
    const faviconUrl = brand?.favicon?.url;
    if (faviconUrl) {
      const updatedAt = brand?.updatedAt ? new Date(brand.updatedAt).getTime() : '';
      const versionedUrl = `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}v=${updatedAt}`;
      return {
        ...baseMetadata,
        icons: {
          icon: [
            { url: versionedUrl },
            { url: '/favicon.ico', sizes: '32x32' },
            { url: '/icon.png', type: 'image/png', sizes: '512x512' },
          ],
          shortcut: versionedUrl,
          apple: [
            { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
          ],
        },
      };
    }
  } catch {
    // Keep the bundled favicon if settings are temporarily unavailable.
  }

  return baseMetadata;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const globalSchema = getGlobalJsonLd();
  let metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1533647998184514';

  try {
    await connectToDatabase();
    const seo = await SEO.findOne().lean();
    if (seo?.metaPixelId && typeof seo.metaPixelId === 'string' && seo.metaPixelId.trim()) {
      metaPixelId = seo.metaPixelId.trim();
    }
  } catch {
    // Keep default/env pixel ID if DB temporarily offline
  }

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="bg-ivory text-rich-black font-sans antialiased" suppressHydrationWarning>
        <JsonLd schema={globalSchema} />
        <MetaPixel initialPixelId={metaPixelId} />
        <AnalyticsTracker />
        <HashScrollHandler />
        <ServerDataProvider>{children}</ServerDataProvider>
      </body>
    </html>
  );
}
