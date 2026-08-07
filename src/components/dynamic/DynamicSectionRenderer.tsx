'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2';
import { PolaroidImage } from '@/components/ui/PolaroidImage';
import { useDynamicSections } from '@/hooks/useDynamicSections';
import type { IDynamicSection, IDynamicSectionItem } from '@/models/DynamicSections';

const bgClasses: Record<string, string> = {
  white: 'bg-white',
  ivory: 'bg-ivory',
  cream: 'bg-cream',
  'rich-black': 'bg-rich-black',
  charcoal: 'bg-charcoal',
  gradient: '',
};

const spacingClasses: Record<string, string> = {
  none: 'py-0',
  small: 'py-12 md:py-16',
  medium: 'py-20 md:py-28',
  large: 'py-28 md:py-36',
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

function SectionButton({
  text,
  link,
  style,
}: {
  text: string;
  link: string;
  style: 'primary' | 'secondary' | 'outline';
}) {
  const base =
    'inline-flex items-center justify-center px-10 py-4 font-sans text-xs font-medium tracking-[0.15em] uppercase transition-all duration-700';
  const variants: Record<string, string> = {
    primary: `${base} bg-rich-black text-white hover:bg-charcoal`,
    secondary: `${base} bg-magenta text-white hover:bg-magenta/90`,
    outline: `${base} border border-rich-black/20 text-rich-black hover:border-magenta hover:text-magenta bg-transparent`,
  };

  if (link.startsWith('/') || link.startsWith('#')) {
    return (
      <Link href={link} className={variants[style] || variants.primary}>
        {text}
      </Link>
    );
  }
  return (
    <a href={link} className={variants[style] || variants.primary}>
      {text}
    </a>
  );
}

function HeroSection({ section }: { section: IDynamicSection }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className={`relative w-full h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden ${bgClasses[section.background] || ''}`}
      style={section.background === 'gradient' ? { background: section.backgroundGradient || undefined } : undefined}
    >
      {section.primaryImage?.url && (
        <PolaroidImage
          src={section.primaryImage.url}
          alt={section.primaryImage.alt || section.heading || section.title}
          fill
          objectFit="cover"
          className="!w-full !h-full"
          containerClassName="absolute inset-0"
          priority
        />
      )}
      <div className="absolute inset-0 bg-rich-black/40" />
      <div className="relative z-10 text-center px-6 max-w-3xl">
        {section.heading && (
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl lg:text-6xl text-white leading-[1.1]"
          >
            {section.heading}
          </motion.h2>
        )}
        {section.subheading && (
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="font-sans text-sm text-white/70 mt-6 tracking-wide"
          >
            {section.subheading}
          </motion.p>
        )}
        {section.buttons.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center mt-10"
          >
            {section.buttons.map((btn, i) => (
              <SectionButton key={i} {...btn} style={btn.style as 'primary' | 'secondary' | 'outline'} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function TextImageSection({ section }: { section: IDynamicSection }) {
  const isRight = section.layout === 'split-right';
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${bgClasses[section.background] || ''}`}
      style={section.background === 'gradient' ? { background: section.backgroundGradient || undefined } : undefined}
    >
      <div className={`p-10 md:p-16 lg:p-20 flex flex-col justify-center ${isRight ? 'md:order-2' : ''}`}>
        {section.heading && (
          <h2 className="font-serif text-3xl md:text-4xl text-rich-black leading-[1.15]">{section.heading}</h2>
        )}
        {section.subheading && (
          <p className="font-sans text-xs text-warm-gray/60 mt-4 uppercase tracking-[0.2em]">{section.subheading}</p>
        )}
        {section.body && (
          <div className="mt-6 font-sans text-sm text-warm-gray leading-relaxed whitespace-pre-line">
            {section.body}
          </div>
        )}
        {section.buttons.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-8">
            {section.buttons.map((btn, i) => (
              <SectionButton key={i} {...btn} style={btn.style as 'primary' | 'secondary' | 'outline'} />
            ))}
          </div>
        )}
      </div>
      <div className={`relative min-h-[300px] md:min-h-0 ${isRight ? 'md:order-1' : ''}`}>
        {section.primaryImage?.url && (
          <PolaroidImage
            src={section.primaryImage.url}
            alt={section.primaryImage.alt || section.heading || ''}
            fill
            className="!w-full !h-full"
            containerClassName="absolute inset-0"
          />
        )}
      </div>
    </motion.div>
  );
}

function BannerSection({ section }: { section: IDynamicSection }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeIn}
      className={`relative w-full py-24 md:py-32 flex items-center justify-center overflow-hidden ${bgClasses[section.background] || ''}`}
      style={section.background === 'gradient' ? { background: section.backgroundGradient || undefined } : undefined}
    >
      {section.primaryImage?.url && (
        <PolaroidImage
          src={section.primaryImage.url}
          alt={section.primaryImage.alt || section.heading || ''}
          fill
          objectFit="cover"
          className="!w-full !h-full"
          containerClassName="absolute inset-0"
        />
      )}
      <div className="absolute inset-0 bg-rich-black/50" />
      <div className="relative z-10 text-center px-6">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-5xl text-white leading-[1.15]">
            {section.heading}
          </motion.h2>
        )}
        {section.buttons.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-4 justify-center mt-8">
            {section.buttons.map((btn, i) => (
              <SectionButton key={i} {...btn} style={btn.style as 'primary' | 'secondary' | 'outline'} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function GallerySection({ section }: { section: IDynamicSection }) {
  if (!section.images.length) return null;
  return (
    <div className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}>
      <div className="max-w-7xl mx-auto px-6">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-4xl text-rich-black text-center mb-12">
            {section.heading}
          </motion.h2>
        )}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {section.images.map((img, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="break-inside-avoid mb-3"
            >
              <PolaroidImage src={img.url} alt={img.alt || ''} width={600} height={800} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardsSection({ section }: { section: IDynamicSection }) {
  if (!section.items.length) return null;
  return (
    <div className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}>
      <div className="max-w-6xl mx-auto px-6">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-4xl text-rich-black text-center mb-12">
            {section.heading}
          </motion.h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {section.items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-white border border-cream/40"
            >
              {item.icon && <span className="text-2xl mb-4 block">{item.icon}</span>}
              {item.heading && <h3 className="font-serif text-xl text-rich-black mb-3">{item.heading}</h3>}
              {item.body && <p className="font-sans text-sm text-warm-gray leading-relaxed">{item.body}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TestimonialsSection({ section }: { section: IDynamicSection }) {
  const [active, setActive] = useState(0);
  
  const validItems = (section.items || []).filter(
    (item) => item && ((item.body && item.body.trim().length > 0) || (item.heading && item.heading.trim().length > 0))
  );

  if (!validItems.length) return null;

  const next = () => setActive((prev) => (prev + 1) % validItems.length);
  const prev = () => setActive((prev) => (prev - 1 + validItems.length) % validItems.length);

  const current = validItems[active] || validItems[0];
  const bodyText = current.body?.trim();
  if (!bodyText) return null;

  return (
    <div className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-4xl text-rich-black mb-12">
            {section.heading}
          </motion.h2>
        )}
        <motion.div key={active} variants={fadeIn} initial="hidden" animate="visible" className="min-h-[200px] flex flex-col items-center justify-center">
          <p className="font-serif text-xl md:text-2xl text-rich-black leading-relaxed italic">
            &ldquo;{bodyText}&rdquo;
          </p>
          <div className="mt-6 flex flex-col items-center">
            {current.heading && (
              (() => {
                const parts = current.heading.split(/ - | – | — /);
                const nameStr = parts[0]?.trim();
                const serviceStr = (parts[1] || current.label)?.trim();
                return (
                  <>
                    <p className="font-serif text-base font-medium text-rich-black">{nameStr}</p>
                    {serviceStr && <p className="font-sans text-xs text-[#C39E96] mt-1">{serviceStr}</p>}
                  </>
                );
              })()
            )}
          </div>
        </motion.div>
        {validItems.length > 1 && (
          <div className="flex gap-4 justify-center mt-8">
            <button onClick={prev} className="text-warm-gray/40 hover:text-rich-black transition-colors text-sm">Prev</button>
            <div className="flex gap-1.5 items-center">
              {validItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`transition-all duration-500 ${i === active ? 'w-6 h-px bg-rich-black' : 'w-3 h-px bg-warm-gray/30'}`}
                />
              ))}
            </div>
            <button onClick={next} className="text-warm-gray/40 hover:text-rich-black transition-colors text-sm">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CTASection({ section }: { section: IDynamicSection }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className={`${bgClasses[section.background] || 'bg-rich-black'} ${spacingClasses[section.spacing] || spacingClasses.medium}`}
      style={section.background === 'gradient' ? { background: section.backgroundGradient || undefined } : undefined}
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        {section.heading && (
          <h2 className={`font-serif text-3xl md:text-4xl leading-[1.15] ${section.background === 'rich-black' || section.background === 'charcoal' ? 'text-white' : 'text-rich-black'}`}>
            {section.heading}
          </h2>
        )}
        {section.body && (
          <p className={`font-sans text-sm mt-4 ${section.background === 'rich-black' || section.background === 'charcoal' ? 'text-white/60' : 'text-warm-gray/60'}`}>
            {section.body}
          </p>
        )}
        {section.buttons.length > 0 && (
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            {section.buttons.map((btn, i) => (
              <SectionButton key={i} {...btn} style={btn.style as 'primary' | 'secondary' | 'outline'} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FAQSection({ section }: { section: IDynamicSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (!section.items.length) return null;

  return (
    <div className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}>
      <div className="max-w-3xl mx-auto px-6">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-4xl text-rich-black text-center mb-12">
            {section.heading}
          </motion.h2>
        )}
        <div className="divide-y divide-cream/60">
          {section.items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="font-sans text-sm text-rich-black pr-4">{item.heading}</span>
                {openIndex === i ? (
                  <HiChevronUp className="w-4 h-4 text-warm-gray/40 shrink-0" />
                ) : (
                  <HiChevronDown className="w-4 h-4 text-warm-gray/40 shrink-0" />
                )}
              </button>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pb-6"
                >
                  <p className="font-sans text-sm text-warm-gray leading-relaxed">{item.body}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RichTextSection({ section }: { section: IDynamicSection }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}
    >
      <div className="max-w-3xl mx-auto px-6">
        {section.heading && (
          <h2 className="font-serif text-3xl md:text-4xl text-rich-black mb-8">{section.heading}</h2>
        )}
        <div
          className="prose prose-sm max-w-none text-warm-gray leading-relaxed
            [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:text-rich-black [&_h1]:mb-4
            [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-rich-black [&_h2]:mb-4
            [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-rich-black [&_h3]:mb-3
            [&_p]:mb-4 [&_p]:text-sm
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_li]:text-sm [&_li]:mb-1
            [&_strong]:text-rich-black
            [&_a]:text-magenta [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: section.richText || section.body || '' }}
        />
      </div>
    </motion.div>
  );
}

function SplitSection({ section }: { section: IDynamicSection }) {
  const isRight = section.layout === 'split-right';
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className={`grid grid-cols-1 md:grid-cols-2 gap-0 ${bgClasses[section.background] || ''}`}
      style={section.background === 'gradient' ? { background: section.backgroundGradient || undefined } : undefined}
    >
      <div className={`relative min-h-[300px] md:min-h-0 ${isRight ? 'md:order-2' : ''}`}>
        {section.images[0]?.url && (
          <PolaroidImage
            src={section.images[0].url}
            alt={section.images[0].alt || ''}
            fill
            className="!w-full !h-full"
            containerClassName="absolute inset-0"
          />
        )}
      </div>
      <div className={`relative min-h-[300px] md:min-h-0 ${isRight ? 'md:order-1' : ''}`}>
        {section.images[1]?.url && (
          <PolaroidImage
            src={section.images[1].url}
            alt={section.images[1].alt || ''}
            fill
            className="!w-full !h-full"
            containerClassName="absolute inset-0"
          />
        )}
      </div>
    </motion.div>
  );
}

function TimelineSection({ section }: { section: IDynamicSection }) {
  if (!section.items.length) return null;
  return (
    <div className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}>
      <div className="max-w-4xl mx-auto px-6">
        {section.heading && (
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-3xl md:text-4xl text-rich-black text-center mb-16">
            {section.heading}
          </motion.h2>
        )}
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-cream/60 md:-translate-x-px" />
          {section.items.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative pl-12 md:pl-0 mb-12 last:mb-0 ${i % 2 === 0 ? 'md:pr-[52%]' : 'md:pl-[52%]'}`}
            >
              <div className={`absolute left-4 md:left-1/2 top-1 w-2 h-2 -translate-x-1/2 rounded-full bg-magenta`} />
              {item.label && <span className="font-mono text-[10px] text-magenta/50 uppercase tracking-[0.2em]">{item.label}</span>}
              {item.heading && <h3 className="font-serif text-lg text-rich-black mt-2">{item.heading}</h3>}
              {item.body && <p className="font-sans text-sm text-warm-gray leading-relaxed mt-2">{item.body}</p>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoSection({ section }: { section: IDynamicSection }) {
  const hasFilm = section.body || section.primaryImage?.url;
  if (!hasFilm) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className={`${bgClasses[section.background] || 'bg-ivory'} ${spacingClasses[section.spacing] || spacingClasses.medium}`}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-rich-black mb-6">Films Coming Soon</h2>
          <p className="font-sans text-sm text-warm-gray/60 max-w-md mx-auto leading-relaxed">
            Capturing beautiful moments is our passion. We are working on something special — stay tuned for our film portfolio.
          </p>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      className={`${bgClasses[section.background] || ''} ${spacingClasses[section.spacing] || spacingClasses.medium}`}
    >
      <div className="max-w-4xl mx-auto px-6">
        {section.heading && (
          <h2 className="font-serif text-3xl md:text-4xl text-rich-black text-center mb-12">{section.heading}</h2>
        )}
        <div className="relative aspect-video bg-charcoal overflow-hidden">
          {section.primaryImage?.url && (
            <PolaroidImage
              src={section.primaryImage.url}
              alt={section.primaryImage.alt || section.heading || ''}
              fill
              className="!w-full !h-full"
              containerClassName="absolute inset-0"
            />
          )}
          {section.body && (
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href={section.body}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-rich-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const renderers: Record<IDynamicSection['type'], React.FC<{ section: IDynamicSection }>> = {
  hero: HeroSection,
  'text-image': TextImageSection,
  banner: BannerSection,
  gallery: GallerySection,
  cards: CardsSection,
  testimonials: TestimonialsSection,
  cta: CTASection,
  faq: FAQSection,
  richtext: RichTextSection,
  split: SplitSection,
  timeline: TimelineSection,
  video: VideoSection,
};

interface DynamicSectionRendererProps {
  pageKey: string;
  className?: string;
}

export default function DynamicSectionRenderer({ pageKey, className = '' }: DynamicSectionRendererProps) {
  const { sections, loading, error } = useDynamicSections(pageKey);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-5 h-5 border border-warm-gray/20 border-t-magenta rounded-full animate-spin" />
      </div>
    );
  }

  if (error) return (
    <div className="py-8 text-center">
      <p className="text-warm-gray/40 font-sans text-sm">Some content could not be loaded.</p>
    </div>
  );
  if (sections.length === 0) return null;

  return (
    <div className={className}>
      {sections.map((section) => {
        const Renderer = renderers[section.type];
        if (!Renderer) return null;
        return <Renderer key={section.id} section={section} />;
      })}
    </div>
  );
}
