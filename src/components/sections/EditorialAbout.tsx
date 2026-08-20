'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { sanitizeMetadataText } from '@/lib/categoryUtils';

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

export default function EditorialAbout() {
  const [aboutData, setAboutData] = useState<any>(null);

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

  // Story 1
  const storyPart1 = sanitizeMetadataText(aboutData?.story, DEFAULT_STORY_1);

  // Story Continued / Secondary Narrative
  const rawStory2 = aboutData?.storyContinued ? sanitizeMetadataText(aboutData.storyContinued, '') : '';
  const paragraph2 = rawStory2 || DEFAULT_STORY_2;

  // Philosophy quote (or default italic highlight)
  const italicStatement = aboutData?.philosophy ? sanitizeMetadataText(aboutData.philosophy, '') : DEFAULT_ITALIC;

  // Journey or third paragraph
  const paragraph3 = aboutData?.journey ? sanitizeMetadataText(aboutData.journey, '') : DEFAULT_STORY_3;

  const rawImg = aboutData?.images?.founderPortrait;
  const rawImgUrl = typeof rawImg === 'string' ? rawImg : rawImg?.url;
  const mainImageUrl = (typeof rawImgUrl === 'string' ? rawImgUrl : '')?.trim() || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg';

  const rawStats = aboutData?.stats;
  const statsList = Array.isArray(rawStats) && rawStats.length > 0
    ? rawStats
    : DEFAULT_STATS;

  return (
    <section className="py-12 md:py-20 bg-white text-[#2B2625] relative overflow-hidden">
      <div className="container-editorial max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Real Founder Photo */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full min-h-[500px] sm:min-h-[580px] md:min-h-[650px] rounded-sm overflow-hidden flex items-center justify-center bg-white"
            >
              <img
                src={mainImageUrl}
                alt="Indira Thakur Portrait"
                className="w-full h-full object-cover object-center opacity-100 select-none pointer-events-auto"
                loading="eager"
                referrerPolicy="no-referrer"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
              <div
                className="absolute inset-0 z-10 bg-transparent select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              />
            </motion.div>
          </div>

          {/* Right Column: Editorial Story Content */}
          <div className="lg:col-span-7 flex flex-col justify-center pl-0 lg:pl-4">
            {/* Section Eyebrow & Heading */}
            <div className="mb-6">
              {eyebrow && (
                <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block font-medium mb-2">
                  {eyebrow}
                </span>
              )}
              {heading && (
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] leading-tight font-normal">
                  {heading}
                </h2>
              )}
              {subheading && (
                <p className="font-serif italic text-base sm:text-lg text-[#7C706D] mt-2 font-normal">
                  {subheading}
                </p>
              )}
            </div>

            {/* Introductory Story Paragraph */}
            <p className="font-sans text-base md:text-[17px] text-[#5A5250] leading-relaxed font-normal whitespace-pre-line">
              {storyPart1}
            </p>

            {/* Divider 1 */}
            <div className="w-full h-px bg-[#E7DDD2] my-4 md:my-6" />

            {/* Second Story Section */}
            <div className="space-y-4">
              {paragraph2 && (
                <p className="font-sans text-base md:text-[17px] text-[#2B2625] leading-relaxed font-normal whitespace-pre-line">
                  {paragraph2}
                </p>
              )}

              {italicStatement && (
                <p className="font-serif italic text-xl sm:text-2xl md:text-[26px] text-[#C39E96] font-normal my-4 leading-snug">
                  {italicStatement}
                </p>
              )}

              {paragraph3 && (
                <p className="font-sans text-base md:text-[17px] text-[#5A5250] leading-relaxed font-normal whitespace-pre-line">
                  {paragraph3}
                </p>
              )}
            </div>

            {/* Divider 2 */}
            <div className="w-full h-px bg-[#E7DDD2] my-4 md:my-6" />

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 pt-2">
              {statsList.map((stat: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] font-semibold leading-none mb-2">
                    {stat.value || '—'}
                  </span>
                  <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#7C706D] font-medium leading-tight whitespace-pre-line">
                    {typeof stat.label === 'string' ? stat.label : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


