import { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/seo/JsonLd';
import AeoQuickAnswers from '@/components/seo/AeoQuickAnswers';
import { getBreadcrumbJsonLd, getServiceJsonLd, getFaqJsonLd } from '@/lib/schema';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SERVICE_DETAILS: Record<string, {
  name: string;
  serviceType: string;
  headline: string;
  description: string;
  fullContent: string;
  highlights: string[];
  faqs: { question: string; answer: string }[];
}> = {
  maternity: {
    name: 'Maternity Photography',
    serviceType: 'Maternity Photography',
    headline: 'Luxury Fine Art Maternity Photography in Mumbai',
    description: 'Celebrate the miraculous journey of motherhood with bespoke, fine art maternity portraiture in Mumbai by Indira Thakur. Includes wardrobe styling, hair & makeup, and partner/family inclusion.',
    fullContent: 'Our luxury maternity sessions are best scheduled between 28 to 34 weeks of pregnancy when your baby bump is beautifully shaped and you feel comfortable. Sessions take place at our peaceful, climate-controlled studio in Mumbai or at scenic outdoor locations across Bandra, Juhu, and South Mumbai.',
    highlights: [
      'Access to exclusive studio wardrobe & flowing luxury gowns',
      'Professional hair & makeup artistry included',
      'Partner, sibling, and pet inclusion at no extra fee',
      'Custom lighting & high-end editorial retouching',
      'Handcrafted physical heirloom albums & framed canvas prints',
    ],
    faqs: [
      {
        question: 'When is the best time to schedule a maternity photo shoot in Mumbai?',
        answer: 'The ideal window for a maternity shoot is between 28 and 34 weeks of pregnancy. At this stage, the belly is beautifully defined and you will feel comfortable moving during the session.'
      },
      {
        question: 'Is maternity wardrobe provided by Indira Thakur Photography?',
        answer: 'Yes! We offer an extensive client wardrobe featuring couture maternity gowns, delicate drapes, and elegant fabrics tailored specifically for fine art portraiture.'
      }
    ]
  },
  newborn: {
    name: 'Newborn Photography',
    serviceType: 'Newborn Photography',
    headline: 'Certified Safe Luxury Newborn Photography in Mumbai',
    description: 'Immortalize the tender early days of your baby with Indira Thakur — Mumbai\'s leading certified newborn safety specialist photographer. Gentle, peaceful, and timeless infant portraiture.',
    fullContent: 'Newborn sessions are ideally conducted within the first 5 to 14 days after birth when infants sleep soundly and naturally curl into sweet newborn poses. The studio is sanitized, heated to an optimal 26°C-28°C, and fully equipped with organic wraps and handcrafted wooden props.',
    highlights: [
      'Master certified newborn safety specialist with 10+ years experience',
      'Sanitized, warm, and peaceful studio environment',
      'All organic wraps, bonnets, bands, and props provided',
      'Posed infant art as well as intimate lifestyle family portraits',
      'Flexible scheduling linked to your estimated due date',
    ],
    faqs: [
      {
        question: 'How early should I book my newborn photo shoot in Mumbai?',
        answer: 'We recommend reserving your session during your second or third trimester. We pencil in your estimated due date and finalize the actual session day once your baby arrives.'
      },
      {
        question: 'What safety protocols are followed for newborn babies?',
        answer: 'Indira Thakur is a certified master newborn safety specialist. Every wrap and prop is sanitized before use, mask/hygiene protocols are strictly maintained, and no pose is forced.'
      }
    ]
  },
  birth: {
    name: 'Birth Photography',
    serviceType: 'Birth Photography',
    headline: 'Documentary Birth Photography & Film Storytelling in Mumbai',
    description: 'Discreet, raw, and deeply emotional birth documentary photography in hospital labor suites and birthing centers across Mumbai.',
    fullContent: 'Birth photography captures the unmatched strength, intimate support, and miraculous first breath of your newborn baby with complete discretion and respect for medical staff and your privacy.',
    highlights: [
      'On-call availability starting from 37 weeks of pregnancy',
      'Discreet, low-light non-intrusive documentary technique',
      'Seamless collaboration with hospital obstetricians & midwives',
      'First breath, immediate skin-to-skin, and golden hour footage',
      'High-resolution digital archive & fine art slideshow film',
    ],
    faqs: [
      {
        question: 'Do hospitals in Mumbai allow birth photographers?',
        answer: 'Many private hospitals and birthing centers in Mumbai allow certified birth photographers upon doctor approval. We coordinate with your healthcare provider in advance.'
      }
    ]
  },
  toddler: {
    name: 'Baby & Toddler Photography',
    serviceType: 'Baby & Toddler Photography',
    headline: 'Baby, Sitter & Toddler Milestone Photography in Mumbai',
    description: 'Capture your child\'s joyous milestones — from 100-day celebrations and 6-month sitter sessions to first birthday cake smashes in Mumbai.',
    fullContent: 'Our milestone sessions focus on authentic expressions, joyful giggles, and curiosity as your little one grows through their first years. We create playful, minimalist setups that highlight your child\'s unique personality.',
    highlights: [
      '100-Day, 6-Month Sitter, and 1st Birthday Milestone sessions',
      'Organic minimalist setups that put focus on your baby',
      'Cake smash and bubble bath setups available upon request',
      'Patient, child-led pace with gentle interaction',
      'Custom milestone digital gallery & custom wall art designs',
    ],
    faqs: [
      {
        question: 'What is a 6-month sitter session?',
        answer: 'A sitter session takes place when your baby can sit unassisted (usually between 6 to 8 months). It is one of the most expressive stages filled with smiles, baby rolls, and playful wonder.'
      }
    ]
  },
  events: {
    name: 'Wedding & Event Storytelling',
    serviceType: 'Wedding Photography',
    headline: 'Fine Art Wedding & Event Storytelling in Mumbai',
    description: 'Cinematographic and documentary event coverage for intimate weddings, engagements, baby showers, naming ceremonies, and family galas in Mumbai.',
    fullContent: 'We document your significant celebrations with editorial flair, capturing unscripted moments, rich candid emotions, cultural details, and luxury portraits of you and your loved ones.',
    highlights: [
      'Documentary candid photography paired with editorial portraits',
      'Comprehensive coverage for pre-wedding, engagement, and main reception',
      'Full cinematography highlight video films',
      'Drone coverage and multi-photographer team availability',
      'Bespoke Italian leather flush-mount wedding albums',
    ],
    faqs: [
      {
        question: 'How far in advance should we book wedding photography in Mumbai?',
        answer: 'We recommend booking 3 to 6 months in advance for prime wedding dates to secure Indira Thakur and our principal creative team.'
      }
    ]
  },
  portrait: {
    name: 'Corporate & Personal Brand Portraiture',
    serviceType: 'Portrait Photography',
    headline: 'Executive & Fine Art Personal Brand Portraiture in Mumbai',
    description: 'Elevate your professional identity with high-impact executive headshots, personal branding photography, and editorial portraits in Mumbai.',
    fullContent: 'Designed for CEOs, founders, creative leaders, and artists seeking world-class headshots and brand imagery that communicate authority, authenticity, and refined luxury.',
    highlights: [
      'Guided posture, expression, and wardrobe direction',
      'High-end magazine quality skin retouching',
      'In-studio lighting and dynamic environmental branding shots',
      'Fast delivery of high-resolution digital files with commercial licensing',
    ],
    faqs: [
      {
        question: 'Where do executive headshot sessions take place?',
        answer: 'Sessions take place at our Bandra West studio or at your corporate offices across Mumbai.'
      }
    ]
  }
};

export async function generateStaticParams() {
  return [
    { slug: 'maternity' },
    { slug: 'newborn' },
    { slug: 'birth' },
    { slug: 'toddler' },
    { slug: 'events' },
    { slug: 'portrait' },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const service = SERVICE_DETAILS[slug] || {
    name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Photography`,
    serviceType: 'Photography',
    headline: `Fine Art ${slug} Photography in Mumbai`,
    description: `Bespoke ${slug} photography experience by Indira Thakur in Mumbai, Maharashtra, India.`,
    fullContent: '',
    highlights: [],
    faqs: []
  };

  return {
    title: `${service.name} Mumbai | Indira Thakur Photography`,
    description: service.description,
    alternates: {
      canonical: `https://indirathakur.com/services/${slug}`,
    },
    openGraph: {
      title: `${service.name} Mumbai | Indira Thakur Photography`,
      description: service.description,
      url: `https://indirathakur.com/services/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.name} | Indira Thakur Photography Mumbai`,
      description: service.description,
    },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const service = SERVICE_DETAILS[slug] || {
    name: `${slug.charAt(0).toUpperCase() + slug.slice(1)} Photography`,
    serviceType: 'Photography',
    headline: `Fine Art ${slug} Photography in Mumbai`,
    description: `Bespoke ${slug} photography experience by Indira Thakur in Mumbai, Maharashtra, India.`,
    fullContent: 'Every commission with Indira Thakur includes bespoke styling, expert lighting, guided direction, and high-end heirloom deliverables.',
    highlights: [
      'Bespoke creative direction',
      'High-end editorial retouching',
      'Custom wall art and physical album options',
    ],
    faqs: [
      {
        question: `How do I book a ${slug} session?`,
        answer: 'You can submit an online inquiry or message directly on WhatsApp at +91 9819620484.'
      }
    ]
  };

  const breadcrumbSchema = getBreadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
    { name: service.name, url: `/services/${slug}` },
  ]);

  const serviceSchema = getServiceJsonLd({
    name: service.name,
    slug,
    description: service.description,
    serviceType: service.serviceType,
  });

  const faqSchema = getFaqJsonLd(service.faqs);

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2B2625] pt-32 pb-24">
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={serviceSchema} />
      <JsonLd schema={faqSchema} />

      <div className="container-editorial max-w-4xl mx-auto px-4">
        {/* Breadcrumb Navigation Bar */}
        <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[11px] uppercase tracking-wider text-[#7C706D] flex items-center gap-2">
          <Link href="/" className="hover:text-[#2B2625]">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-[#2B2625]">Services</Link>
          <span>/</span>
          <span className="text-[#C39E96] font-medium">{service.name}</span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
            FINE ART COMMISSION — MUMBAI
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl text-[#2B2625] leading-tight">
            {service.headline}
          </h1>
          <div className="w-12 h-px bg-[#C39E96]/40 mx-auto my-6" />
          <p className="font-sans text-sm md:text-base text-[#5C5250] leading-relaxed">
            {service.description}
          </p>
        </div>

        {/* Detailed Overview Block for AI & Readers */}
        <div className="bg-white p-8 md:p-12 rounded border border-[#E8DFD8] shadow-xs mb-12">
          <h2 className="font-serif text-2xl text-[#2B2625] mb-4">The Experience & Philosophy</h2>
          <p className="font-sans text-sm md:text-base text-[#5C5250] leading-relaxed mb-8">
            {service.fullContent}
          </p>

          <h3 className="font-serif text-lg text-[#2B2625] mb-4">Signature Session Highlights</h3>
          <ul className="space-y-3 mb-8">
            {service.highlights.map((item, idx) => (
              <li key={idx} className="font-sans text-sm text-[#5C5250] flex items-start gap-3">
                <span className="text-[#C39E96] font-bold mt-0.5">✦</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="p-6 bg-[#FAF6F3] rounded border border-[#E8DFD8] flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-serif text-lg text-[#2B2625]">Reserve Your Session</h4>
              <p className="font-sans text-xs text-[#7C706D] mt-1">Direct booking & telephone consultations with Indira Thakur</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://wa.me/919819620484?text=${encodeURIComponent(`Hi Indira, I would like to inquire about booking a ${service.name} session.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-[#25D366] text-white font-sans text-xs uppercase tracking-wider font-medium rounded hover:bg-[#20bd5a] transition-colors"
              >
                WhatsApp (+91 9819620484)
              </a>
              <Link
                href={`/contact?service=${encodeURIComponent(slug)}`}
                className="px-6 py-3 bg-[#2B2625] text-white font-sans text-xs uppercase tracking-wider font-medium hover:bg-[#3D3534] transition-colors rounded shadow-xs"
              >
                Inquire Online
              </Link>
            </div>
          </div>
        </div>

        {/* Service FAQs */}
        <div className="mb-16">
          <h2 className="font-serif text-2xl text-[#2B2625] mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {service.faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded border border-[#E8DFD8]">
                <h3 className="font-serif text-base text-[#2B2625] font-medium mb-2">{faq.question}</h3>
                <p className="font-sans text-xs sm:text-sm text-[#5C5250] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Direct AEO Quick Answers */}
        <AeoQuickAnswers
          title={`Key Information — ${service.name} Mumbai`}
          subtitle="Direct facts for booking, studio details, and pricing"
        />

        <div className="mt-12 text-center">
          <Link
            href="/services"
            className="font-sans text-xs text-[#C39E96] uppercase tracking-[0.2em] hover:text-[#2B2625] transition-colors"
          >
            ← View All Photography Services
          </Link>
        </div>
      </div>
    </div>
  );
}
