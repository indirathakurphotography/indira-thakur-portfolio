export const SITE_URL = 'https://www.indirathakur.com';
export const LOGO_URL = 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/seo/1785574467987-Indira_Photography_logo.jpeg';

export const PERSON_INDIRA = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#indira-thakur`,
  name: 'Indira Thakur',
  jobTitle: 'Founder & Master Fine Art Photographer',
  description: 'Indira Thakur is a premier luxury maternity, newborn, portrait photographer and filmmaker in Mumbai with over 10 years of experience and 1,000+ family stories captured.',
  url: SITE_URL,
  image: LOGO_URL,
  email: 'photography@indirathakur.com',
  telephone: '+91 98196 20484',
  knowsAbout: [
    'Newborn Photography',
    'Maternity Photography',
    'Birth Photography',
    'Baby & Toddler Photography',
    'Fine Art Portraiture',
    'Wedding & Event Storytelling',
    'Cinematography & Short Films',
  ],
  award: [
    'Master Certified Newborn Safety Specialist',
    '5-Star Rated Fine Art Studio',
  ],
  worksFor: {
    '@id': `${SITE_URL}/#organization`,
  },
  sameAs: [
    'https://instagram.com',
    'https://facebook.com',
    'https://youtube.com',
  ],
};

export const LOCAL_BUSINESS_STUDIO = {
  '@type': ['LocalBusiness', 'Photographer', 'ProfessionalService'],
  '@id': `${SITE_URL}/#organization`,
  name: 'Indira Thakur Photography',
  legalName: 'Indira Thakur Photography',
  alternateName: 'Indira Thakur Fine Art Photography Studio',
  url: SITE_URL,
  logo: LOGO_URL,
  image: LOGO_URL,
  email: 'photography@indirathakur.com',
  telephone: '+91 98196 20484',
  priceRange: '₹₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, Credit Card, Bank Transfer, UPI',
  description: 'Luxury fine art photography studio in Mumbai specializing in maternity, newborn, birth, toddler, wedding, event photography, and film cinematography.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bandra West',
    addressLocality: 'Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '400050',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 19.0760,
    longitude: 72.8777,
  },
  hasMap: 'https://maps.google.com/?q=Mumbai+Maharashtra+India',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
  ],
  areaServed: [
    { '@type': 'City', name: 'Mumbai' },
    { '@type': 'AdministrativeArea', name: 'Bandra, Mumbai' },
    { '@type': 'AdministrativeArea', name: 'South Mumbai' },
    { '@type': 'City', name: 'Thane' },
    { '@type': 'City', name: 'Navi Mumbai' },
    { '@type': 'AdministrativeArea', name: 'Juhu, Mumbai' },
    { '@type': 'AdministrativeArea', name: 'Powai, Mumbai' },
    { '@type': 'AdministrativeArea', name: 'Andheri, Mumbai' },
    { '@type': 'AdministrativeArea', name: 'Maharashtra' },
    { '@type': 'Country', name: 'India' },
  ],
  serviceArea: 'Mumbai, Bandra, South Mumbai, Thane, Navi Mumbai, and destination photography assignments across India',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91 98196 20484',
    contactType: 'bookings and client enquiries',
    availableLanguage: ['English', 'Hindi'],
    areaServed: 'IN',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5.0',
    reviewCount: '128',
    bestRating: '5',
    worstRating: '1',
  },
  founder: {
    '@id': `${SITE_URL}/#indira-thakur`,
  },
  sameAs: [
    'https://instagram.com',
    'https://facebook.com',
    'https://youtube.com',
  ],
};

export function getGlobalJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      LOCAL_BUSINESS_STUDIO,
      PERSON_INDIRA,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'Indira Thakur Photography',
        description: 'Luxury fine art photographer specializing in newborn, maternity, portrait, and event photography in Mumbai.',
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        inLanguage: 'en-IN',
      },
    ],
  };
}

export function getBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function getFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getServiceJsonLd(service: {
  name: string;
  slug: string;
  description: string;
  serviceType: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/services/${service.slug}/#service`,
    name: service.name,
    serviceType: service.serviceType,
    description: service.description,
    url: `${SITE_URL}/services/${service.slug}`,
    image: service.image || LOGO_URL,
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: LOCAL_BUSINESS_STUDIO.areaServed,
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: `${SITE_URL}/contact`,
      servicePhone: '+91 98196 20484',
      availableLanguage: ['English', 'Hindi'],
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.name} Packages`,
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: `Standard ${service.name} Session`,
            description: `Full bespoke ${service.name} photography experience with hair, makeup, styling, and retouched high-resolution images.`,
          },
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
  };
}

export function getImageObjectJsonLd(images: { url: string; title: string; caption?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': images.map((img, idx) => ({
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#image-${idx}`,
      contentUrl: img.url,
      url: img.url,
      name: img.title,
      caption: img.caption || img.title,
      creditText: 'Indira Thakur Photography',
      copyrightNotice: '© Indira Thakur Photography',
      author: {
        '@id': `${SITE_URL}/#indira-thakur`,
      },
      locationCreated: {
        '@type': 'Place',
        name: 'Mumbai, Maharashtra, India',
      },
    })),
  };
}

export function getVideoObjectJsonLd(videos: {
  title: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration: string;
  contentUrl?: string;
  embedUrl?: string;
  transcript?: string;
}[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': videos.map((vid, idx) => ({
      '@type': 'VideoObject',
      '@id': `${SITE_URL}/#video-${idx}`,
      name: vid.title,
      description: vid.description,
      thumbnailUrl: vid.thumbnailUrl,
      uploadDate: vid.uploadDate,
      duration: vid.duration,
      contentUrl: vid.contentUrl || SITE_URL,
      embedUrl: vid.embedUrl || vid.contentUrl || SITE_URL,
      transcript: vid.transcript || vid.description,
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    })),
  };
}

export function getReviewsJsonLd(reviews: { author: string; reviewBody: string; ratingValue: number; datePublished?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': reviews.map((rev) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: rev.author,
      },
      datePublished: rev.datePublished || '2025-01-01',
      reviewBody: rev.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rev.ratingValue || 5,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: {
        '@id': `${SITE_URL}/#organization`,
      },
    })),
  };
}
