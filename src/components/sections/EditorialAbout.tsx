'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { sanitizeMetadataText } from '@/lib/categoryUtils';

const DEFAULT_STORY_1 = "I am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.";
const DEFAULT_STORY_2 = "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.";
const DEFAULT_ITALIC = "Photography, for me, is much more than taking pictures.";
const DEFAULT_STORY_3 = "It is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.";

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

  // Clean raw story from any legacy "Hello!" prefix
  let rawStory1 = sanitizeMetadataText(aboutData?.story, DEFAULT_STORY_1);
  if (rawStory1.startsWith('Hello!\n')) {
    rawStory1 = rawStory1.replace('Hello!\n', '').trim();
  } else if (rawStory1.startsWith('Hello!\n\n')) {
    rawStory1 = rawStory1.replace('Hello!\n\n', '').trim();
  } else if (rawStory1.startsWith('Hello! ')) {
    rawStory1 = rawStory1.replace('Hello! ', '').trim();
  }

  const storyPart1 = rawStory1 || DEFAULT_STORY_1;

  // Story Part 2 breakdown
  const rawStory2 = sanitizeMetadataText(aboutData?.storyContinued, `${DEFAULT_STORY_2}\n${DEFAULT_ITALIC}\n${DEFAULT_STORY_3}`);
  const storyLines = rawStory2.split('\n').filter((s: string) => s.trim().length > 0);

  const paragraph2 = storyLines[0] || DEFAULT_STORY_2;
  const italicStatement = storyLines[1] || DEFAULT_ITALIC;
  const paragraph3 = storyLines[2] || DEFAULT_STORY_3;

  const rawImg = aboutData?.images?.founderPortrait;
  const rawImgUrl = typeof rawImg === 'string' ? rawImg : rawImg?.url;
  const mainImageUrl = (typeof rawImgUrl === 'string' ? rawImgUrl : '')?.trim() || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg';

  return (
    <section className="py-16 md:py-28 bg-white text-[#2B2625] relative overflow-hidden">
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
              className="relative w-full h-[500px] sm:h-[580px] md:h-[650px] rounded-sm overflow-hidden flex items-center justify-center bg-white"
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
            {/* Introductory Story Paragraph */}
            <p className="font-sans text-base md:text-[17px] text-[#5A5250] leading-relaxed font-normal">
              {storyPart1}
            </p>

            {/* Divider 1 */}
            <div className="w-full h-px bg-[#E7DDD2] my-7 md:my-9" />

            {/* Second Story Section */}
            <div className="space-y-6">
              <p className="font-sans text-base md:text-[17px] text-[#2B2625] leading-relaxed font-normal">
                {paragraph2}
              </p>

              <p className="font-serif italic text-xl sm:text-2xl md:text-[26px] text-[#C39E96] font-normal my-4 leading-snug">
                {italicStatement}
              </p>

              <p className="font-sans text-base md:text-[17px] text-[#5A5250] leading-relaxed font-normal">
                {paragraph3}
              </p>
            </div>

            {/* Divider 2 */}
            <div className="w-full h-px bg-[#E7DDD2] my-7 md:my-9" />

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-2">
              <div className="flex flex-col">
                <span className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] font-semibold leading-none mb-3">
                  11+
                </span>
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#7C706D] font-medium leading-tight">
                  YEARS OF<br />EXPERIENCE
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] font-semibold leading-none mb-3">
                  500+
                </span>
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#7C706D] font-medium leading-tight">
                  FAMILIES<br />DOCUMENTED
                </span>
              </div>

              <div className="flex flex-col">
                <span className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#2B2625] font-semibold leading-none mb-3">
                  100%
                </span>
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#7C706D] font-medium leading-tight">
                  SATISFACTION<br />RATING
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

