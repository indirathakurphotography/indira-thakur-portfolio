import { MetadataRoute } from 'next';
import { fetchAllServices } from '@/lib/servicesStorage';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.indirathakur.com';
  const currentDate = new Date().toISOString();

  const staticServiceSlugs = ['maternity', 'newborn', 'birth', 'toddler', 'family', 'portrait', 'brand', 'corporate', 'events'];
  let dynamicServiceSlugs: string[] = [];

  try {
    const dbServices = await fetchAllServices();
    dynamicServiceSlugs = dbServices.map((s) => s.slug).filter(Boolean);
  } catch {
    // Fall back to static
  }

  const allServiceSlugs = Array.from(new Set([...staticServiceSlugs, ...dynamicServiceSlugs]));

  const serviceUrls = allServiceSlugs.map((slug) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...serviceUrls,
    {
      url: `${baseUrl}/gallery`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/films`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/testimonials`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];
}
