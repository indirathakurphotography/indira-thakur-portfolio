'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeMetadataText } from '@/lib/categoryUtils';
import { getTypographyStyles } from '@/types/typography';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';

const DEFAULT_STORY_1 = "I am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.";
const DEFAULT_STORY_2 = "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.";
const DEFAULT_ITALIC = "Photography, for me, is much more than taking pictures.";
const DEFAULT_STORY_3 = "It is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.";
const DEFAULT_EXTENDED_BIO = "Over the past decade, I have had the privilege of capturing more than 500 family legacies across India. From private studio sessions in Mumbai to intimate home stories, every commission is treated as a masterwork of fine art.\n\nMy approach blends the raw authenticity of documentary photojournalism with the soft, ethereal elegance of editorial portraiture. Using museum-grade lighting, organic textures, and absolute patience, we create heirlooms meant to be cherished across generations.";

const DEFAULT_STATS = [
  { value: '13+', label: 'YEARS OF\nEXPERIENCE' },
  { value: '500+', label: 'FAMILIES\nDOCUMENTED' },
  { value: '15+', label: 'PUBLICATIONS &\nFESTIVALS' },
  { value: '100%', label: 'SATISFACTION\nRATING' },
];

export default function EditorialAbout() {
  const [aboutData, setAboutData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

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
      }
    }
    loadAbout();
  }, []);

  const eyebrow = sanitizeMetadataText(aboutData?.eyebrow, 'THE ARTIST & STORYTELLER');
  const heading = sanitizeMetadataText(aboutData?.heading, 'Indira Thakur');
  const subheading = sanitizeMetadataText(aboutData?.subheading, 'Lifestyle Stills & Films');

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

  // Story parts
  const storyPart1 = sanitizeMetadataText(aboutData?.story, DEFAULT_STORY_1);
  const paragraph2 = sanitizeMetadataText(aboutData?.storyContinued, DEFAULT_STORY_2);
  const italicStatement = sanitizeMetadataText(aboutData?.philosophy, DEFAULT_ITALIC);
  const paragraph3 = sanitizeMetadataText(aboutData?.journey, DEFAULT_STORY_3);
  const extendedBio = sanitizeMetadataText(aboutData?.extendedBio || aboutData?.journeyContinued, DEFAULT_EXTENDED_BIO);

  // Founder Portrait Image Support
  const rawFounderPortrait = aboutData?.images?.founderPortrait;
  const founderPortraitUrl = (typeof rawFounderPortrait === 'string' ? rawFounderPortrait : rawFounderPortrait?.url) ||
    'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg';

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
                className="w-full h-full object-cover object-center select-none"
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

            {/* Introductory Story Paragraph (Visible Initially) */}
            <p
              className={`leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
              style={bodyStyles.style}
            >
              {storyPart1}
            </p>

            {/* Read More / Read Less Collapsible Section Containing All Remaining Content */}
            <div className="space-y-4">
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="overflow-hidden space-y-4 pt-1"
                  >
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

                    {extendedBio && (
                      <div
                        className={`space-y-3 pt-2 border-t border-[#E7DDD2]/70 leading-relaxed whitespace-pre-line ${bodyStyles.className}`}
                        style={bodyStyles.style}
                      >
                        {extendedBio}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle Read More / Read Less Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#2B2625] hover:text-[#C39E96] transition-colors py-1 cursor-pointer font-semibold"
                >
                  <span>{isExpanded ? 'Read Less' : 'Read More'}</span>
                  {isExpanded ? <HiChevronUp className="w-4 h-4 text-[#C39E96]" /> : <HiChevronDown className="w-4 h-4 text-[#C39E96]" />}
                </button>
              </div>
            </div>

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
                href="/gallery"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2B2625] text-white hover:bg-[#3D3534] font-sans text-xs uppercase tracking-[0.2em] rounded-sm transition-colors shadow-xs"
              >
                <span>Explore Fine Art Gallery</span>
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
