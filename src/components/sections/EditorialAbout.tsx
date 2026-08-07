'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PolaroidImage } from '@/components/ui/PolaroidImage';

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

  const eyebrow = aboutData?.eyebrow || 'THE ARTIST & STORYTELLER';
  const heading = aboutData?.heading || 'Indira Thakur';
  const subheading = aboutData?.subheading || 'Lifestyle Stills & Films';

  const storyPart1 = aboutData?.story || "Hello!\nI am Indira Thakur, a passionate storyteller and professional photographer. I come from a background in Journalism and Public Relations, where I developed a deep appreciation for storytelling and human emotions. In 2014, I transformed that passion into photography, and what started as a creative journey soon became my life's purpose.";
  
  const storyPart2 = aboutData?.storyContinued || "I am a certified newborn photographer and specialise in child photography, maternity, birth photography and portrait photography.\nPhotography, for me, is much more than taking pictures.\nIt is about preserving emotions, celebrating life, documenting milestones, and creating timeless memories that people will treasure for generations.";

  const rawImgUrl = aboutData?.images?.founderPortrait?.url;
  const isInvalidFounderImg = !rawImgUrl || rawImgUrl.includes('z28rt42ozq72icajozdy') || rawImgUrl.includes('services/portraits');
  const mainImageUrl = isInvalidFounderImg
    ? 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg'
    : rawImgUrl;

  const stats = aboutData?.stats || [
    { label: 'Years of Experience', value: '11+' },
    { label: 'Families Documented', value: '500+' },
    { label: 'Satisfaction Rating', value: '100%' },
  ];

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
              <span className="font-serif italic text-[#7C706D] font-normal text-2xl sm:text-3xl md:text-4xl block mt-2">
                {subheading}
              </span>
            </h2>
            <div className="w-12 h-px bg-[#C39E96]/40 mt-6" />
          </motion.div>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Left Column: Real Founder Photo */}
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
                priority={true}
                sizes="(max-width: 1024px) 100vw, 50vw"
                objectFit="contain"
                className="!w-full !h-full"
                containerClassName="!w-full !h-full"
              />
            </motion.div>
          </div>

          {/* Right Column: Story Part 1 & Story Part 2 */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Story Part 1 */}
            <div className="space-y-4 font-sans text-sm md:text-base text-[#7C706D] leading-relaxed">
              {storyPart1.split('\n').map((paragraph: string, idx: number) => (
                <p key={`p1-${idx}`} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="w-16 h-px bg-[#C39E96]/30 my-6" />

            {/* Story Part 2 */}
            <div className="space-y-4 font-sans text-sm md:text-base text-[#2B2625] leading-relaxed font-normal">
              {storyPart2.split('\n').map((paragraph: string, idx: number) => (
                <p key={`p2-${idx}`} className={idx === 1 ? 'font-serif italic text-lg text-[#C39E96]' : ''}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-6 my-10 pt-8 border-t border-[#E7DDD2]">
              {stats.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col">
                  <span className="font-serif text-3xl md:text-4xl text-[#2B2625] font-semibold">
                    {item.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] font-medium mt-1">
                    {item.label}
                  </span>
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
      </div>
    </section>
  );
}
