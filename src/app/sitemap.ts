import { MetadataRoute } from 'next';
import { SITE_METADATA } from '@/lib/seoConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_METADATA.baseUrl;
  const now = new Date();

  const routes = [
    { route: '', priority: 1.0, changeFrequency: 'daily' as const },
    { route: '/about', priority: 0.9, changeFrequency: 'weekly' as const },
    { route: '/services', priority: 0.9, changeFrequency: 'weekly' as const },
    { route: '/gallery', priority: 0.9, changeFrequency: 'weekly' as const },
    { route: '/films', priority: 0.8, changeFrequency: 'weekly' as const },
    { route: '/contact', priority: 0.9, changeFrequency: 'monthly' as const },
    { route: '/faq', priority: 0.8, changeFrequency: 'monthly' as const },
    { route: '/testimonials', priority: 0.8, changeFrequency: 'weekly' as const },
  ];

  const serviceCategories = [
    'maternity-photography',
    'newborn-storytelling',
    'birth-photography',
    'family-portraiture',
    'baby-photography',
    'corporate-portraits',
  ];

  const serviceRoutes = serviceCategories.map((category) => ({
    url: `${baseUrl}/services/${category}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const mainRoutes = routes.map((item) => ({
    url: `${baseUrl}${item.route}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  return [...mainRoutes, ...serviceRoutes];
}
