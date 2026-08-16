import { MetadataRoute } from 'next';
import { SITE_METADATA } from '@/lib/seoConfig';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${SITE_METADATA.baseUrl}/sitemap.xml`,
  };
}
