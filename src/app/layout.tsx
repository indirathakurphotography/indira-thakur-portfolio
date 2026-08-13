import type { Metadata } from 'next';
import { Playfair_Display, Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import ServerDataProvider from '@/components/layout/ServerDataProvider';
import { getGlobalJsonLd } from '@/lib/schema';
import JsonLd from '@/components/seo/JsonLd';
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://indirathakurphotography.com'),
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
  authors: [{ name: 'Indira Thakur', url: 'https://indirathakurphotography.com' }],
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
    canonical: 'https://indirathakurphotography.com',
    languages: {
      'en-IN': 'https://indirathakurphotography.com',
      'en-US': 'https://indirathakurphotography.com',
    },
  },
  icons: {
    icon: [
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg', type: 'image/jpeg' },
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [
      { url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg' },
      { url: '/apple-touch-icon.png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Indira Thakur Photography',
    title: 'Indira Thakur Photography | Fine Art Newborn & Maternity Studio Mumbai',
    description: 'Premier luxury photographer specializing in newborn, maternity, portrait, and wedding storytelling in Mumbai, Maharashtra, India.',
    url: 'https://indirathakurphotography.com',
    images: [
      {
        url: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg',
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
    images: ['https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const globalSchema = getGlobalJsonLd();

  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="bg-ivory text-rich-black font-sans antialiased" suppressHydrationWarning>
        <JsonLd schema={globalSchema} />
        <AnalyticsTracker />
        <ServerDataProvider>{children}</ServerDataProvider>
      </body>
    </html>
  );
}