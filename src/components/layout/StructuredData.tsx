import { SITE_METADATA } from '@/lib/seoConfig';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataProps {
  pageType?: 'home' | 'about' | 'services' | 'gallery' | 'films' | 'contact' | 'faq' | 'testimonials' | 'service-detail';
  breadcrumbs?: BreadcrumbItem[];
  faqItems?: Array<{ question: string; answer: string }>;
  serviceName?: string;
  serviceDescription?: string;
  customImages?: Array<{ url: string; alt: string; description?: string }>;
}

export default function StructuredData({
  pageType = 'home',
  breadcrumbs,
  faqItems,
  serviceName,
  serviceDescription,
  customImages,
}: StructuredDataProps) {
  const orgId = `${SITE_METADATA.baseUrl}/#organization`;
  const personId = `${SITE_METADATA.baseUrl}/#person`;
  const websiteId = `${SITE_METADATA.baseUrl}/#website`;

  // 1. Organization + LocalBusiness + ProfessionalService Combined Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': orgId,
    name: SITE_METADATA.siteName,
    alternateName: 'Indira Thakur Fine Art Photography',
    url: SITE_METADATA.baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_METADATA.baseUrl}/logo.png`,
      caption: SITE_METADATA.siteName,
    },
    image: SITE_METADATA.defaultOgImage,
    description: 'Premier Mumbai maternity photographer, newborn photographer, birth photographer, family photographer, and luxury fine art photography studio in Mumbai.',
    email: SITE_METADATA.email,
    telephone: SITE_METADATA.phone,
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_METADATA.streetAddress,
      addressLocality: SITE_METADATA.addressLocality,
      addressRegion: SITE_METADATA.addressRegion,
      postalCode: SITE_METADATA.postalCode,
      addressCountry: SITE_METADATA.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_METADATA.latitude,
      longitude: SITE_METADATA.longitude,
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Mumbai',
      },
      {
        '@type': 'State',
        name: 'Maharashtra',
      },
      {
        '@type': 'Country',
        name: 'India',
      },
    ],
    sameAs: [
      SITE_METADATA.socialLinks.instagram,
      SITE_METADATA.socialLinks.facebook,
      SITE_METADATA.socialLinks.linkedin,
    ],
    founder: {
      '@type': 'Person',
      '@id': personId,
      name: SITE_METADATA.founder,
      jobTitle: 'Founder & Lead Photographer',
    },
    knowsAbout: SITE_METADATA.targetedKeywords,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Photography Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Maternity Photography',
            description: 'Bespoke fine art maternity photography in Mumbai celebrating expectant mothers.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Newborn Photography',
            description: 'Gentle, peaceful newborn storytelling in Mumbai within 14 days of birth.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Birth Photography',
            description: 'Documentary birth photography capturing arrival and raw emotion.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Family Photography',
            description: 'Luxury fine art family portraiture and heirloom keepsakes in Mumbai.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Baby Photography',
            description: 'Milestone baby photography capturing natural smiles and growth.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Corporate Photography',
            description: 'Executive portraits and corporate fine art portraiture in Mumbai.',
          },
        },
      ],
    },
  };

  // 2. Person Schema (Indira Thakur)
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId,
    name: SITE_METADATA.founder,
    jobTitle: 'Lead Fine Art Photographer',
    worksFor: {
      '@id': orgId,
    },
    url: `${SITE_METADATA.baseUrl}/about`,
    image: SITE_METADATA.defaultOgImage,
    sameAs: [
      SITE_METADATA.socialLinks.instagram,
      SITE_METADATA.socialLinks.facebook,
      SITE_METADATA.socialLinks.linkedin,
    ],
    knowsAbout: SITE_METADATA.targetedKeywords,
    description: 'Fine art photographer in Mumbai specializing in maternity, newborn, birth, baby, family, and luxury portraiture.',
  };

  // 3. WebSite Schema with SearchAction
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': websiteId,
    url: SITE_METADATA.baseUrl,
    name: SITE_METADATA.siteName,
    alternateName: 'Indira Thakur Photography Portfolio',
    description: 'Mumbai maternity photographer, newborn photographer, birth photographer, and luxury family portrait studio in Mumbai.',
    publisher: {
      '@id': orgId,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_METADATA.baseUrl}/gallery?category={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // 4. BreadcrumbList Schema
  const defaultBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    { name: 'Home', url: SITE_METADATA.baseUrl },
    ...(pageType !== 'home'
      ? [
          {
            name: pageType.charAt(0).toUpperCase() + pageType.slice(1),
            url: `${SITE_METADATA.baseUrl}/${pageType}`,
          },
        ]
      : []),
  ];

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: defaultBreadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };

  // 5. Service Schema (If Service Page or Service Detail)
  const serviceSchemaList = [
    {
      '@type': 'Service',
      name: 'Maternity Photography Mumbai',
      serviceType: 'Maternity Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Bespoke fine art maternity photography in Mumbai with couture studio wardrobe and guided posing.',
    },
    {
      '@type': 'Service',
      name: 'Newborn Photography Mumbai',
      serviceType: 'Newborn Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Serene, peaceful newborn photography in Mumbai using organic wraps and natural poses.',
    },
    {
      '@type': 'Service',
      name: 'Birth Photography Mumbai',
      serviceType: 'Birth Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Discreet documentary birth photography capturing raw emotion and the moment of arrival.',
    },
    {
      '@type': 'Service',
      name: 'Family Photography Mumbai',
      serviceType: 'Family Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Fine art family portraiture capturing genuine connection and heirloom album creations.',
    },
    {
      '@type': 'Service',
      name: 'Baby Photography Mumbai',
      serviceType: 'Baby Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Milestone baby photography sessions capturing smiles, sitting milestones, and first birthdays.',
    },
    {
      '@type': 'Service',
      name: 'Corporate Photography Mumbai',
      serviceType: 'Corporate Photography',
      provider: { '@id': orgId },
      areaServed: 'Mumbai, India',
      description: 'Executive headshots and editorial corporate photography in Mumbai.',
    },
  ];

  const currentServiceSchema = serviceName
    ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${serviceName} Mumbai`,
        serviceType: serviceName,
        provider: { '@id': orgId },
        areaServed: 'Mumbai, India',
        description: serviceDescription || `Fine art ${serviceName.toLowerCase()} in Mumbai by Indira Thakur.`,
      }
    : null;

  // 6. FAQ Schema
  const defaultFaqList = [
    {
      question: 'When is the best time to schedule a newborn session in Mumbai?',
      answer: 'Newborn sessions are ideally conducted within the first 5 to 14 days after birth when babies sleep deeply and naturally curl into peaceful poses. We recommend booking during your second trimester.',
    },
    {
      question: 'Do you provide studio wardrobe and props for maternity & newborn shoots?',
      answer: 'Yes, our Mumbai studio features a hand-curated collection of organic hand-knit wraps, couture maternity dresses, silk drapes, and minimalist neutral props.',
    },
    {
      question: 'Where are sessions conducted in Mumbai?',
      answer: 'Sessions take place either in our serene, climate-controlled studio in Mumbai or on location at hand-selected outdoor scenic landscapes during golden hour.',
    },
    {
      question: 'How and when will we receive our fine art photographs?',
      answer: 'Within two weeks of your shoot, you will receive a password-protected private proofing gallery. Fully retouched high-resolution files and museum-grade album keepsakes are delivered within 3-4 weeks.',
    },
  ];

  const effectiveFaqs = faqItems && faqItems.length > 0 ? faqItems : defaultFaqList;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: effectiveFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  // 7. ImageObject Schema
  const imageSchemas = (customImages && customImages.length > 0 ? customImages : []).map((img) => ({
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: img.url,
    license: SITE_METADATA.baseUrl,
    acquireLicensePage: `${SITE_METADATA.baseUrl}/contact`,
    creditText: 'Indira Thakur Photography',
    creator: {
      '@type': 'Person',
      name: SITE_METADATA.founder,
    },
    copyrightNotice: 'Indira Thakur Photography',
    description: img.description || img.alt,
    name: img.alt,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {(pageType === 'services' || pageType === 'home') && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': serviceSchemaList,
            }),
          }}
        />
      )}

      {currentServiceSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(currentServiceSchema) }}
        />
      )}

      {(pageType === 'faq' || pageType === 'home') && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      {imageSchemas.map((imgSchema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(imgSchema) }}
        />
      ))}
    </>
  );
}
