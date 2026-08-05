'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PolaroidImage } from '@/components/ui/PolaroidImage';

export default function EditorialAbout() {
  const [aboutData, setAboutData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await fetch('/api/about');
        if (res.ok) {
          const data = await res.json();
          if (data && Object.keys(data).length > 0) {
            setAboutData(data);
          }
        }
      } catch (err) {
        console.error('Error fetching About section:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  if (loading || !aboutData) return null;

  const safeStr = (val: any, fallback = '') => (typeof val === 'string' ? val : (typeof val === 'number' ? String(val) : fallback));

  const eyebrow = safeStr(aboutData.eyebrow);
  const heading = safeStr(aboutData.heading);
  const headingItalic = safeStr(aboutData.subheading);

  const rawQuote =
    safeStr(aboutData.philosophy) ||
    safeStr(aboutData.story);

  const getBioParagraphs = (): string[] => {
    const paragraphs: string[] = [];
    if (safeStr(aboutData.story).trim()) paragraphs.push(safeStr(aboutData.story).trim());
    if (safeStr(aboutData.storyContinued).trim()) paragraphs.push(safeStr(aboutData.storyContinued).trim());
    if (safeStr(aboutData.philosophyContinued).trim()) paragraphs.push(safeStr(aboutData.philosophyContinued).trim());
    if (safeStr(aboutData.journey).trim()) paragraphs.push(safeStr(aboutData.journey).trim());
    if (safeStr(aboutData.journeyContinued).trim()) paragraphs.push(safeStr(aboutData.journeyContinued).trim());
    if (safeStr(aboutData.welcomeMessage).trim()) paragraphs.push(safeStr(aboutData.welcomeMessage).trim());
    return paragraphs;
  };

  const bioParagraphs = getBioParagraphs();

  if (!bioParagraphs.length && !eyebrow && !heading && !aboutData?.images?.founderPortrait?.url) {
    return null;
  }

  const getMilestones = () => {
    if (aboutData?.stats && aboutData.stats.length > 0 && aboutData.stats.some((s: any) => s.label || s.value)) {
      return aboutData.stats.map((s: any) => ({
        year: safeStr(s.value, '★'),
        label: safeStr(s.label),
        detail: ''
      }));
    }
    if (aboutData?.achievements && aboutData.achievements.length > 0 && aboutData.achievements.some((a: any) => a.title)) {
      return aboutData.achievements.map((a: any) => ({
        year: safeStr(a.year, '★'),
        label: safeStr(a.title),
        detail: safeStr(a.description)
      }));
    }
    return [];
  };

  const milestones = getMilestones();
  const aboutImgs: any = aboutData?.images || {};

  const mainImageUrl =
    aboutImgs.founderPortrait?.url ||
    aboutImgs.storyImage?.url ||
    aboutData?.image ||
    '';

  const secondaryImageUrl =
    aboutImgs.storyImage?.url && aboutImgs.storyImage?.url !== mainImageUrl
      ? aboutImgs.storyImage.url
      : aboutImgs.editorial1?.url || '';

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
            {eyebrow && (
              <span className="font-mono text-[11px] text-[#C39E96] uppercase tracking-[0.35em] block mb-3 font-medium">
                {eyebrow}
              </span>
            )}
            {heading && (
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#2B2625] leading-[1.05] tracking-tight">
                {heading}
                {headingItalic && (
                  <>
                    <br />
                    <span className="font-serif italic text-[#7C706D] font-normal text-3xl sm:text-4xl md:text-5xl">
                      {headingItalic}
                    </span>
                  </>
                )}
              </h2>
            )}
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
              {mainImageUrl ? (
                <PolaroidImage
                  src={mainImageUrl}
                  alt="Indira Thakur Portrait"
                  width={800}
                  priority={true}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  objectFit="contain"
                  className="!w-full !h-full"
                  containerClassName="!w-full !h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#FAF6F3]">
                  <div className="w-16 h-16 rounded-full border border-[#C39E96]/40 flex items-center justify-center text-[#C39E96] mb-4">
                    <span className="font-serif font-medium text-lg">IT</span>
                  </div>
                  <span className="font-serif text-xl font-light text-[#2B2625]/80">Indira Thakur Photography</span>
                </div>
              )}
            </motion.div>

            {/* Overlapping Floating Inset Image */}
            {secondaryImageUrl ? (
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
                  width={512}
                  priority={true}
                  fill
                  sizes="300px"
                  objectFit="contain"
                  className="!w-full !h-full"
                  containerClassName="!w-full !h-full"
                />
              </motion.div>
            ) : null}
          </div>

          {/* Right Column: Bio Narrative & Milestones */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Quote Feature */}
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
            {milestones.length > 0 && (
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
            )}

            {/* CTA */}
            <div className="flex items-center gap-6 mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#2B2625] text-white font-sans text-[11px] uppercase tracking-[0.25em] font-medium hover:bg-[#3D3534] transition-all duration-500 shadow-sm"
              >
                Inquire With Indira
              </Link>
              <Link
                href="/gallery"
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
