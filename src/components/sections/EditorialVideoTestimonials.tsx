'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiPlay, HiXMark, HiStar, HiFilm } from 'react-icons/hi2';
import { formatVideoEmbedUrl, isDirectVideoUrl, getVideoThumbnail } from '@/lib/videoUrlHelper';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { getTypographyStyles } from '@/types/typography';

interface VideoTestimonialItem {
  _id: string;
  clientName: string;
  title: string;
  role?: string;
  quote?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  rating?: number;
  featured?: boolean;
}

export default function EditorialVideoTestimonials() {
  const { config } = useSiteConfig();
  const [videoTestimonials, setVideoTestimonials] = useState<VideoTestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoTestimonialItem | null>(null);

  const vtData = {
    eyebrow: config?.videoTestimonials?.eyebrow || 'Cinematic Client Reviews',
    heading: config?.videoTestimonials?.heading || 'Video Testimonials',
    description: config?.videoTestimonials?.description || 'Hear directly from our families, couples, and clients sharing their personal storytelling experiences',
    eyebrowTypography: config?.videoTestimonials?.eyebrowTypography,
    headingTypography: config?.videoTestimonials?.headingTypography,
    descriptionTypography: config?.videoTestimonials?.descriptionTypography,
    nameTypography: config?.videoTestimonials?.nameTypography,
    roleTypography: config?.videoTestimonials?.roleTypography,
    titleTypography: config?.videoTestimonials?.titleTypography,
    quoteTypography: config?.videoTestimonials?.quoteTypography,
  };

  const eyebrowStyles = getTypographyStyles(vtData.eyebrowTypography, {
    defaultFamily: 'mono',
    defaultSize: 'compact',
    defaultWeight: '500',
    defaultColor: '#D4AF7F',
  });

  const headingStyles = getTypographyStyles(vtData.headingTypography, {
    defaultFamily: 'serif',
    defaultSize: 'huge',
    defaultWeight: '400',
    defaultColor: '#FAF6F3',
  });

  const descriptionStyles = getTypographyStyles(vtData.descriptionTypography, {
    defaultFamily: 'sans',
    defaultSize: 'normal',
    defaultWeight: '300',
    defaultColor: '#FAF6F3',
  });

  const nameStyles = getTypographyStyles(vtData.nameTypography, {
    defaultFamily: 'serif',
    defaultSize: 'large',
    defaultWeight: '500',
    defaultColor: '#FAF6F3',
  });

  const roleStyles = getTypographyStyles(vtData.roleTypography, {
    defaultFamily: 'mono',
    defaultSize: 'compact',
    defaultWeight: '400',
    defaultColor: '#D4AF7F',
  });

  const titleStyles = getTypographyStyles(vtData.titleTypography, {
    defaultFamily: 'serif',
    defaultSize: 'normal',
    defaultWeight: '400',
    defaultColor: '#FAF6F3',
  });

  const quoteStyles = getTypographyStyles(vtData.quoteTypography, {
    defaultFamily: 'sans',
    defaultSize: 'compact',
    defaultWeight: '300',
    defaultColor: '#FAF6F3',
  });

  useEffect(() => {
    async function fetchVideoTestimonials() {
      try {
        setLoading(true);
        const res = await fetch('/api/video-testimonials');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const valid = data
              .filter((item: VideoTestimonialItem) => item.videoUrl && item.clientName)
              .map((item: VideoTestimonialItem) => ({
                ...item,
                videoUrl: formatVideoEmbedUrl(item.videoUrl),
                thumbnailUrl: getVideoThumbnail(item.videoUrl, item.thumbnailUrl),
              }));
            setVideoTestimonials(valid);
          }
        }
      } catch (err) {
        console.error('Failed to fetch video testimonials for homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVideoTestimonials();
  }, []);

  // Lock body scroll when video lightbox popup is open
  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeVideo]);

  if (!loading && videoTestimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-24 md:py-36 bg-[#181514] text-white relative border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16 md:mb-24"
        >
          {vtData.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF7F]/10 border border-[#D4AF7F]/30 mb-4">
              <HiFilm className="w-3.5 h-3.5 text-[#D4AF7F]" />
              <span
                className={`uppercase tracking-[0.3em] ${eyebrowStyles.className}`}
                style={eyebrowStyles.style}
              >
                {vtData.eyebrow}
              </span>
            </div>
          )}
          {vtData.heading && (
            <h2
              className={`leading-tight ${headingStyles.className}`}
              style={headingStyles.style}
            >
              {vtData.heading}
            </h2>
          )}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF7F] to-transparent mx-auto my-6" />
          {vtData.description && (
            <p
              className={`leading-relaxed ${descriptionStyles.className}`}
              style={descriptionStyles.style}
            >
              {vtData.description}
            </p>
          )}
        </motion.div>

        {/* Video Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videoTestimonials.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => setActiveVideo(item)}
              className="bg-[#1F1B1A] border border-[#D4AF7F]/20 rounded-2xl overflow-hidden shadow-xl hover:border-[#D4AF7F]/50 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              {/* Thumbnail Poster Container */}
              <div className="relative aspect-video bg-[#0D0B0A] overflow-hidden">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.clientName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#D4AF7F]/40 bg-[#151211]">
                    <HiFilm className="w-12 h-12 mb-2" />
                    <span className="font-sans text-[10px] uppercase tracking-widest text-[#FAF6F3]/60">Video Story</span>
                  </div>
                )}
                {/* Light Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/70 transition-all duration-300" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6F3] text-[#151211] flex items-center justify-center shadow-2xl group-hover:scale-115 group-hover:bg-[#D4AF7F] group-hover:text-white transition-all duration-300">
                    <HiPlay className="w-7 h-7 ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {item.duration && (
                  <span className="absolute bottom-3 right-3 bg-black/80 text-[#FAF6F3] font-mono text-[10px] px-2.5 py-0.5 rounded-md backdrop-blur-xs border border-white/10">
                    {item.duration}
                  </span>
                )}
              </div>

              {/* Card Metadata */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3
                      className={`group-hover:text-[#D4AF7F] transition-colors leading-snug ${nameStyles.className}`}
                      style={nameStyles.style}
                    >
                      {item.clientName}
                    </h3>
                    {/* Star Rating */}
                    <div className="flex gap-1 shrink-0">
                      {Array.from({ length: item.rating || 5 }).map((_, i) => (
                        <HiStar key={i} className="w-3.5 h-3.5 text-[#D4AF7F] fill-current" />
                      ))}
                    </div>
                  </div>

                  {item.role && (
                    <p
                      className={`uppercase tracking-wider mb-2 ${roleStyles.className}`}
                      style={roleStyles.style}
                    >
                      {item.role}
                    </p>
                  )}

                  {item.title && (
                    <p
                      className={`italic line-clamp-1 ${titleStyles.className}`}
                      style={titleStyles.style}
                    >
                      &ldquo;{item.title}&rdquo;
                    </p>
                  )}

                  {item.quote && (
                    <p
                      className={`mt-2 line-clamp-2 leading-relaxed ${quoteStyles.className}`}
                      style={quoteStyles.style}
                    >
                      {item.quote}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#D4AF7F]/15 flex items-center justify-between font-sans text-xs text-[#D4AF7F] font-medium group-hover:translate-x-1 transition-transform">
                  <span>Watch Video Story</span>
                  <span>→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* VIDEO LIGHTBOX / POPUP MODAL */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1F1B1A] border border-[#D4AF7F]/30 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#D4AF7F]/20 bg-[#151211]">
                <div>
                  <h3 className="font-serif text-lg sm:text-xl text-[#FAF6F3] font-medium">
                    {activeVideo.clientName}
                  </h3>
                  {activeVideo.title && (
                    <p className="font-sans text-xs text-[#D4AF7F]">
                      {activeVideo.title}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-2 text-[#FAF6F3]/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  aria-label="Close video"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>

              {/* Video Player Window */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {!isDirectVideoUrl(activeVideo.videoUrl) ? (
                  <iframe
                    src={formatVideoEmbedUrl(activeVideo.videoUrl)}
                    title={activeVideo.clientName}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    src={activeVideo.videoUrl}
                    poster={activeVideo.thumbnailUrl}
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>

              {/* Modal Footer Description */}
              {activeVideo.quote && (
                <div className="p-5 bg-[#151211] border-t border-[#D4AF7F]/20">
                  <p className="font-serif italic text-sm text-[#FAF6F3]/80 leading-relaxed">
                    “{activeVideo.quote}”
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
