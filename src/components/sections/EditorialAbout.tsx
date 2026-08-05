'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { PolaroidImage } from '@/components/ui/PolaroidImage';

export default function EditorialAbout() {
  const { config } = useSiteConfig();
  const [dbAbout, setDbAbout] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [aboutRes, brandsRes] = await Promise.all([
          fetch('/api/about'),
          fetch('/api/brands')
        ]);
        if (aboutRes.ok) {
          const aData = await aboutRes.json();
          if (aData && (aData.story || aData.heading || aData.images)) {
            setDbAbout(aData);
          }
        }
        if (brandsRes.ok) {
          const bData = await brandsRes.json();
          if (Array.isArray(bData)) {
            setBrands(bData);
          }
        }
      } catch (err) {
        console.error('Error fetching about/brands data:', err);
      }
    }
    fetchData();
  }, []);

  const aboutData = dbAbout || config?.about || {};

  const eyebrow = aboutData.eyebrow || 'THE STORY & VISION';
  const heading = aboutData.heading || 'Preserving Life\'s Most Precious Moments';
  const headingItalic = aboutData.subheading || aboutData.headingItalic || 'With Grace & Artistic Precision';

  const rawQuote =
    (aboutData.philosophy && aboutData.philosophy.trim()) ||
    (aboutData.philosophyQuote && aboutData.philosophyQuote.trim()) ||
    'I believe every family is unique, and every session deserves patience, warmth, creativity, and genuine care.';

  const DEFAULT_BIO_PARAGRAPHS = [
    'Hello! I am Indira Thakur, a passionate storyteller and fine art photographer based in Mumbai. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for human emotions, narrative framing, and authentic connection.',
    'In 2013, I transformed that passion into photography. What began as a creative journey soon became my life\'s purpose — capturing the delicate beauty of newborn beginnings, the radiance of maternity, and intimate family milestones that families treasure for generations.',
    'Every photograph is crafted with meticulous attention to natural lighting, hand-selected wardrobe textures, and a comfortable, relaxed atmosphere for your family.'
  ];

  const getBioParagraphs = (): string[] => {
    if (Array.isArray(aboutData.bio) && aboutData.bio.length > 0) {
      return aboutData.bio;
    }
    if (typeof aboutData.bio === 'string' && aboutData.bio.trim().length > 0) {
      return [aboutData.bio.trim()];
    }

    const paragraphs: string[] = [];
    if (aboutData.story?.trim()) paragraphs.push(aboutData.story.trim());
    if (aboutData.storyContinued?.trim()) paragraphs.push(aboutData.storyContinued.trim());
    if (aboutData.philosophyContinued?.trim()) paragraphs.push(aboutData.philosophyContinued.trim());
    if (aboutData.journey?.trim()) paragraphs.push(aboutData.journey.trim());
    if (aboutData.journeyContinued?.trim()) paragraphs.push(aboutData.journeyContinued.trim());
    if (aboutData.welcomeMessage?.trim()) paragraphs.push(aboutData.welcomeMessage.trim());

    return paragraphs.length > 0 ? paragraphs : DEFAULT_BIO_PARAGRAPHS;
  };

  const bioParagraphs = getBioParagraphs();

  const DEFAULT_MILESTONES = [
    { year: '12+', label: 'Years Experience', detail: 'Fine Art Photography' },
    { year: '1,500+', label: 'Families Served', detail: 'Worldwide Trust' },
    { year: 'Awarded', label: 'Filmcity Premier', detail: 'Chitrapataka Festival' },
  ];

  const getMilestones = () => {
    if (aboutData.stats && aboutData.stats.length > 0 && aboutData.stats.some((s: any) => s.label || s.value)) {
      return aboutData.stats.map((s: any) => ({
        year: s.value || '★',
        label: s.label || '',
        detail: ''
      }));
    }
    if (aboutData.achievements && aboutData.achievements.length > 0 && aboutData.achievements.some((a: any) => a.title)) {
      return aboutData.achievements.map((a: any) => ({
        year: a.year || '★',
        label: a.title || '',
        detail: a.description || ''
      }));
    }
    if (Array.isArray(aboutData.milestones) && aboutData.milestones.length > 0) {
      return aboutData.milestones;
    }
    return DEFAULT_MILESTONES;
  };

  const milestones = getMilestones();

  const mainImageUrl =
    (aboutData.images?.founderPortrait?.url && aboutData.images.founderPortrait.url.trim()) ||
    (aboutData.mainImage?.url && aboutData.mainImage.url.trim()) ||
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg';

  const secondaryImageUrl =
    (aboutData.images?.storyImage?.url && aboutData.images.storyImage.url.trim()) ||
    (aboutData.secondaryImage?.url && aboutData.secondaryImage.url.trim()) ||
    'https://images.unsplash.com/photo-1537655780520-1e392ede8122?q=80&w=1200';

  const hasSecondaryImage = Boolean(
    secondaryImageUrl &&
    secondaryImageUrl.trim().length > 0 &&
    secondaryImageUrl.trim() !== mainImageUrl.trim()
  );

  useEffect(() => {
    if (mainImageUrl) {
      const p1 = new Image();
      p1.src = mainImageUrl;
    }
    if (secondaryImageUrl) {
      const p2 = new Image();
      p2.src = secondaryImageUrl;
    }
  }, [mainImageUrl, secondaryImageUrl]);

  return (
    <section className="py-24 md:py-36 bg-white text-[#2B2625] relative overflow-hidden">
      <div className="container-editorial">
        {/* Top Header */}
        <div className="max-w-3xl mb-16 md:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
              {eyebrow}
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2B2625] leading-[1.05] tracking-tight">
              {heading}
              <br />
              <span className="font-serif italic text-[#7C706D] font-normal text-3xl sm:text-4xl md:text-5xl">
                {headingItalic}
              </span>
            </h2>
            <div className="w-12 h-px bg-[#C39E96]/40 mt-6" />
          </motion.div>
        </div>

        {/* Asymmetrical Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left Column: Portrait & Secondary Overlapping Artwork */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative min-h-[480px] md:min-h-[620px] rounded-sm overflow-hidden shadow-2xl border border-[#E7DDD2] bg-[#FAF6F3] p-2 md:p-3 flex items-center justify-center"
            >
              <PolaroidImage
                src={mainImageUrl}
                alt="Indira Thakur Portrait"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                objectFit="contain"
                className="!w-full !h-full"
                containerClassName="!w-full !h-full"
              />
            </motion.div>

            {/* Overlapping Floating Inset Image */}
            {hasSecondaryImage && (
              <motion.div
                initial={{ opacity: 0.95 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="hidden sm:flex absolute -bottom-8 -right-4 md:-right-8 w-56 md:w-72 min-h-[220px] md:min-h-[280px] bg-[#FAF6F3] p-2 border-4 border-[#FAF6F3] shadow-2xl overflow-hidden rounded-sm z-10 items-center justify-center"
              >
                <PolaroidImage
                  src={secondaryImageUrl}
                  alt="Fine Art Photography"
                  fill
                  sizes="300px"
                  objectFit="contain"
                  className="!w-full !h-full"
                  containerClassName="!w-full !h-full"
                />
              </motion.div>
            )}
          </div>

          {/* Right Column: Bio Narrative & Milestones */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Quote Feature - ONLY render if quote text exists, NEVER render an empty card */}
            {rawQuote ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="p-8 md:p-10 bg-white border border-[#E7DDD2]/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] mb-8 rounded-sm relative"
              >
                <span className="font-serif text-5xl text-[#C39E96]/40 absolute top-3 left-4 font-normal">“</span>
                <p className="font-serif italic text-lg md:text-xl text-[#2B2625] leading-relaxed relative z-10 pt-2">
                  {rawQuote}
                </p>
              </motion.div>
            ) : null}

            {/* Bio Paragraphs */}
            <div className="space-y-4 font-sans text-sm md:text-base text-[#7C706D] leading-relaxed">
              {bioParagraphs.map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Milestones Stats Bar */}
            <div className="grid grid-cols-3 gap-6 my-10 pt-8 border-t border-[#E7DDD2]">
              {milestones.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-serif text-3xl md:text-4xl text-[#2B2625] font-semibold">
                    {item.year}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] font-medium mt-1">
                    {item.label}
                  </span>
                  {item.detail && (
                    <span className="font-sans text-[11px] text-[#7C706D]/70 mt-1 hidden sm:block">
                      {item.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#2B2625] text-white font-sans text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-[#3D3534] transition-all duration-500 shadow-sm"
              >
                Inquire With Indira
              </Link>
              <Link
                href="/services"
                className="font-sans text-[11px] text-[#C39E96] uppercase tracking-[0.25em] hover:text-[#2B2625] transition-colors"
              >
                View Experience →
              </Link>
            </div>
          </div>
        </div>

        {/* Featured Press / Publications Banner */}
        <div className="mt-20 pt-12 border-t border-[#E7DDD2]/70 text-center">
          <span className="font-mono text-[10px] text-[#C39E96] uppercase tracking-[0.35em] block mb-6 font-medium">
            FEATURED IN & HONORED BY
          </span>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-85">
            {brands.length > 0 ? (
              brands.map((b: any, i: number) => {
                const logoUrl = b.logo?.url || b.logoUrl || b.logo || (typeof b.image === 'string' ? b.image : b.image?.url);
                return (
                  <div key={b._id || b.id || i} className="flex items-center gap-8 md:gap-16">
                    {i > 0 && <span className="text-[#C39E96]/40 text-xs">•</span>}
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={b.name || 'Featured Brand'}
                        className="h-8 md:h-11 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                      />
                    ) : (
                      <span className="font-serif text-lg md:text-xl text-[#2B2625] tracking-widest uppercase font-light">
                        {b.name}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                <span className="font-serif text-lg md:text-xl text-[#2B2625] tracking-widest uppercase font-light">
                  Chitrapataka Film Festival
                </span>
                <span className="text-[#C39E96]/40 text-xs">•</span>
                <span className="font-serif text-lg md:text-xl text-[#2B2625] tracking-widest uppercase font-light">
                  Dadasaheb Phalke Chitranagri
                </span>
                <span className="text-[#C39E96]/40 text-xs">•</span>
                <span className="font-serif text-lg md:text-xl text-[#2B2625] tracking-widest uppercase font-light">
                  Filmcity Goregaon
                </span>
                <span className="text-[#C39E96]/40 text-xs">•</span>
                <span className="font-serif text-lg md:text-xl text-[#2B2625] tracking-widest uppercase font-light">
                  Vogue India Weddings
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
