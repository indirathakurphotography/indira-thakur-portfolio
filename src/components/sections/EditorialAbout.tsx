'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { sanitizeMetadataText } from '@/lib/categoryUtils';
import { getTypographyStyles } from '@/types/typography';
import { HiArrowRight } from 'react-icons/hi2';

const DEFAULT_STORY_1 = "I am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.";
const DEFAULT_STORY_2 = "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.";
const DEFAULT_ITALIC = "Photography, for me, is much more than taking pictures.";
const DEFAULT_STORY_3 = "It is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.";
const DEFAULT_STATS = [
  { value: '13+', label: 'YEARS OF\nEXPERIENCE' },
  { value: '500+', label: 'FAMILIES\nDOCUMENTED' },
  { value: '15+', label: 'PUBLICATIONS &\nFESTIVALS' },
  { value: '100%', label: 'SATISFACTION\nRATING' },
];

export interface EditorialAboutProps {
  isDedicatedPage?: boolean;
}

export default function EditorialAbout({ isDedicatedPage }: EditorialAboutProps) {
  const [aboutData, setAboutData] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const pathname = usePathname();

  // If prop not provided, determine by pathname (/about or /about/...)
  const isFullView = isDedicatedPage !== undefined ? isDedicatedPage : pathname?.startsWith('/about');

  useEffect(() => {
    async function loadAbout() {
      try {
        const res = await fetch('/api/about');
        if (res.ok) {
          const data = await res.json();
          setAboutData(data);
        }
      } catch (err) {
        console.error('Failed to load about content:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadAbout();
  }, []);

  const eyebrow = isLoaded ? (aboutData?.eyebrow ?? '') : 'THE ARTIST & STORYTELLER';
  const heading = isLoaded ? (aboutData?.heading ?? '') : 'Indira Thakur';
  const subheading = isLoaded ? (aboutData?.subheading ?? '') : 'Lifestyle Stills & Films';

  const eyebrowStyles = getTypographyStyles(aboutData?.eyebrowTypography, {
    defaultFamily: 'mono',
    defaultSize: 'compact',
    defaultWeight: '500',
    defaultColor: '#C39E96',
  });

  const headingStyles = getTypographyStyles(aboutData?.headingTypography, {
    defaultFamily: 'serif',
    defaultSize: 'grand',
    defaultWeight: '400',
    defaultColor: '#2B2625',
  });

  const subheadingStyles = getTypographyStyles(aboutData?.subheadingTypography, {
    defaultFamily: 'serif',
    defaultSize: 'large',
    defaultWeight: '400',
    defaultColor: '#7C706D',
  });

  const bodyStyles = getTypographyStyles(aboutData?.bodyTypography, {
    defaultFamily: 'sans',
    defaultSize: 'normal',
    defaultWeight: '400',
    defaultColor: '#5A5250',
  });

  // Story parts strictly mapped from CMS
  const storyPart1 = isLoaded ? (aboutData?.story ?? '') : DEFAULT_STORY_1;
  const paragraph2 = isLoaded ? (aboutData?.storyContinued ?? '') : DEFAULT_STORY_2;
  const italicStatement = isLoaded ? (aboutData?.philosophy ?? '') : DEFAULT_ITALIC;
  const paragraph3 = isLoaded ? (aboutData?.journey ?? '') : '';
  const extendedBio = isLoaded
    ? (aboutData?.extendedBio !== undefined ? aboutData.extendedBio : (aboutData?.journeyContinued ?? ''))
    : '';

  // Founder Portrait Image Support
  const rawFounderPortrait = aboutData?.images?.founderPortrait;
  const founderPortraitUrl = (typeof rawFounderPortrait === 'string' ? rawFounderPortrait : rawFounderPortrait?.url) ||
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg';

  // 2 Additional Images for Dedicated About Page
  const rawStudioPhoto = aboutData?.images?.behindTheScenes || aboutData?.images?.storyImage;
  const studioPhotoUrl = (typeof rawStudioPhoto === 'string' ? rawStudioPhoto : rawStudioPhoto?.url) ||
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg';

  const rawJourneyPhoto = aboutData?.images?.journeyImage || aboutData?.images?.welcomeImage;
  const journeyPhotoUrl = (typeof rawJourneyPhoto === 'string' ? rawJourneyPhoto : rawJourneyPhoto?.url) ||
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg';

  const rawStats = aboutData?.stats;
  const statsList = Array.isArray(rawStats) && rawStats.length > 0 ? rawStats : DEFAULT_STATS;

  return (
    <section className="py-12 md:py-20 bg-white text-[#2B2625] relative overflow-hidden">
      <div className="container-editorial max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Founder Portrait Showcase */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-lg border border-[#E7DDD2]"
            >
              <img
                src={founderPortraitUrl}
                alt="Indira Thakur Portrait"
                className="w-full h-full object-cover object-top select-none"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>

          {/* Right Column: Editorial Story Content */}
          <div className="lg:col-span-7 flex flex-col justify-center pl-0 lg:pl-4 space-y-6">
            {/* Section Eyebrow & Heading */}
            <div>
              {eyebrow && (
                <span
                  className={`uppercase tracking-[0.35em] block mb-2 ${eyebrowStyles.className}`}
                  style={eyebrowStyles.style}
                >
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2
                  className={`leading-tight ${headingStyles.className}`}
                  style={headingStyles.style}
                >
                  {heading}
                </h2>
              )}
              {subheading && (
                <p
                  className={`italic mt-1 ${subheadingStyles.className}`}
                  style={subheadingStyles.style}
                >
                  {subheading}
                </p>
              )}
            </div>

            {/* Introductory Story Paragraph (Always Visible if present) */}
            {storyPart1 && (
              <p
                className={`leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
                style={bodyStyles.style}
              >
                {storyPart1}
              </p>
            )}

            {/* Homepage Mode: Read More Link to Dedicated /about Page */}
            {!isFullView ? (
              <div className="pt-1">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#2B2625] hover:text-[#C39E96] transition-colors py-1 cursor-pointer font-semibold group"
                >
                  <span>Read More</span>
                  <HiArrowRight className="w-4 h-4 text-[#C39E96] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              /* Dedicated About Page Mode: Full Narrative & 2 CMS Images */
              <div className="space-y-5 pt-1">
                {paragraph2 && (
                  <p
                    className={`leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
                    style={bodyStyles.style}
                  >
                    {paragraph2}
                  </p>
                )}

                {italicStatement && (
                  <blockquote
                    className={`border-l-2 border-[#C39E96] pl-4 my-4 italic leading-snug ${bodyStyles.className}`}
                    style={{ ...bodyStyles.style, fontStyle: 'italic', fontSize: '1.2rem' }}
                  >
                    "{italicStatement}"
                  </blockquote>
                )}

                {paragraph3 && (
                  <p
                    className={`leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
                    style={bodyStyles.style}
                  >
                    {paragraph3}
                  </p>
                )}

                {/* 2 Additional About Images Managed from About CMS without badges */}
                {(studioPhotoUrl || journeyPhotoUrl) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                    {studioPhotoUrl && (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E7DDD2] shadow-xs">
                        <img
                          src={studioPhotoUrl}
                          alt="Studio Photography"
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {journeyPhotoUrl && (
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#E7DDD2] shadow-xs">
                        <img
                          src={journeyPhotoUrl}
                          alt="Fine Art In Action"
                          className="w-full h-full object-cover select-none"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                )}

                {extendedBio && (
                  <div
                    className={`space-y-3 pt-3 border-t border-[#E7DDD2]/70 leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
                    style={bodyStyles.style}
                  >
                    {extendedBio}
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="w-full h-px bg-[#E7DDD2]" />

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-2">
              {statsList.map((stat: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-serif text-3xl sm:text-4xl text-[#2B2625] font-semibold leading-none mb-1.5">
                    {stat.value || '—'}
                  </span>
                  <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-[#7C706D] font-medium leading-tight whitespace-pre-line">
                    {typeof stat.label === 'string' ? stat.label : ''}
                  </span>
                </div>
              ))}
            </div>

            {/* Direct CTA */}
            <div className="pt-4 flex items-center gap-4">
              <Link
                href={aboutData?.ctaLink || '/services'}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B2625] text-white hover:bg-[#3D3534] font-sans text-xs uppercase tracking-[0.2em] rounded-sm transition-colors shadow-xs"
              >
                <span>{aboutData?.ctaText || 'Explore My Work'}</span>
                <span>→</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#E7DDD2] text-[#2B2625] hover:bg-[#FAF6F3] font-sans text-xs uppercase tracking-[0.2em] rounded-sm transition-colors"
              >
                <span>Book a Consultation</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

