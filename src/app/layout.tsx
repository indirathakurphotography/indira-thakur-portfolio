import type { Metadata } from 'next';
import { Playfair_Display, Inter, DM_Mono } from 'next/font/google';
import './globals.css';
import ServerDataProvider from '@/components/layout/ServerDataProvider';
import StructuredData from '@/components/layout/StructuredData';
import AIAssistantWidget from '@/components/ui/AIAssistantWidget';
import ImageProtection from '@/components/ui/ImageProtection';
import { getMetadataForPage, SITE_METADATA } from '@/lib/seoConfig';

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
  ...getMetadataForPage('home'),
  title: {
    default: 'Indira Thakur Photography | Mumbai Maternity & Newborn Fine Art Photographer',
    template: '%s | Indira Thakur Photography',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="bg-ivory text-rich-black font-sans antialiased" suppressHydrationWarning>
        <StructuredData pageType="home" />
        <ServerDataProvider>
          <ImageProtection />
          {children}
          <AIAssistantWidget />
        </ServerDataProvider>
      </body>
    </html>
  );
}