import EditorialAbout from '@/components/sections/EditorialAbout';
import EditorialTestimonials from '@/components/sections/EditorialTestimonials';
import JsonLd from '@/components/seo/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/schema';
import type { Metadata } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import SEO from '@/models/SEO';

export async function generateMetadata(): Promise<Metadata> {
  try {
    await connectToDatabase();
    const seo = await SEO.findOne().lean() as any;
    if (seo) {
      return {
        title: seo.metaTitle ? `${seo.metaTitle} | About` : 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
        description: seo.metaDescription || 'Learn about Indira Thakur — premier fine art photographer and filmmaker in Mumbai with over 10 years of experience in newborn, maternity, portrait, and event storytelling.',
        keywords: seo.keywords ? seo.keywords.split(',').map((k: string) => k.trim()).filter(Boolean) : undefined,
        alternates: {
          canonical: 'https://indirathakurphotography.com/about',
        },
        openGraph: {
          title: seo.ogTitle || 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
          description: seo.ogDescription || 'Learn about Indira Thakur, fine art photographer specializing in newborn, maternity, and expressive portraiture in Mumbai, Maharashtra, India.',
          url: 'https://indirathakurphotography.com/about',
          type: 'profile',
          images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
        },
        twitter: {
          card: (seo.twitterCard as any) || 'summary_large_image',
          title: seo.twitterTitle || 'About Indira Thakur | Photographer in Mumbai',
          description: seo.twitterDescription || '10+ years capturing 1,000+ luxury family stories in Mumbai, India.',
          images: seo.twitterImage ? [seo.twitterImage] : undefined,
        },
      };
    }
  } catch (err) {
    console.warn('Error fetching dynamic metadata:', err);
  }

  return {
    title: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
    description: 'Learn about Indira Thakur — premier fine art photographer and filmmaker in Mumbai with over 10 years of experience in newborn, maternity, portrait, and event storytelling.',
    alternates: {
      canonical: 'https://indirathakurphotography.com/about',
    },
    openGraph: {
      title: 'About Indira Thakur | Master Photographer & Filmmaker Mumbai',
      description: 'Learn about Indira Thakur, fine art photographer specializing in newborn, maternity, and expressive portraiture in Mumbai, Maharashtra, India.',
      url: 'https://indirathakurphotography.com/about',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'About Indira Thakur | Photographer in Mumbai',
      description: '10+ years capturing 1,000+ luxury family stories in Mumbai, India.',
    },
  };
}

export default function AboutPage() {
  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'About Indira Thakur', url: '/about' },
  ]);

  return (
    <div className="pt-24 bg-[#FAF6F3]">
      <JsonLd schema={breadcrumbSchema} />
      <EditorialAbout />
      <EditorialTestimonials />
    </div>
  );
}
