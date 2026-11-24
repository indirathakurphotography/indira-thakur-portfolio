import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/media/'],
        disallow: [
          '/admin/',
          '/api/admin/',
          '/api/auth/',
          '/api/upload/',
          '/api/contacts/',
          '/api/bookings/',
          '/api/cms-export/',
          '/api/dashboard/',
          '/api/security/',
          '/api/audit-logs/',
          '/api/audit-storage/',
          '/api/migrate-r2/',
          '/api/migrate/',
          '/api/chat/',
          '/api/analytics/',
        ],
      },
      {
        userAgent: 'WhatsApp',
        allow: ['/', '/api/media/'],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: ['/', '/api/media/'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      {
        userAgent: 'CCBot',
        allow: '/',
      },
    ],
    sitemap: 'https://www.indirathakur.com/sitemap.xml',
  };
}
