'use client';

import { useEffect, useState } from 'react';
import { Play, ArrowUpRight } from 'lucide-react';

type Item = {
  _id: string;
  title: string;
  category?: string;
  mediaType: 'instagram' | 'video';
  url: string;
  thumbnailUrl?: string;
};

function getInstagramEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'instagram.com') return url;

    const parts = parsed.pathname.split('/').filter(Boolean);
    const mediaTypeIndex = parts.findIndex((part) => ['reel', 'reels', 'p', 'tv'].includes(part.toLowerCase()));
    const shortcode = mediaTypeIndex >= 0 ? parts[mediaTypeIndex + 1] : '';

    if (!shortcode) return url;
    return `https://www.instagram.com/p/${shortcode}/embed/`;
  } catch {
    return url;
  }
}

export default function InstagramReels({ category, home = false }: { category: string; home?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [activePlayId, setActivePlayId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/instagram-links?category=${encodeURIComponent(category)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, [category]);

  useEffect(() => {
    if (!items.length) return;
    if (typeof window === 'undefined') return;

    const scriptId = 'instagram-embed-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const processEmbeds = () => {
      try {
        if ((window as any).instgrm?.Embeds?.process) {
          (window as any).instgrm.Embeds.process();
        }
      } catch {
        // ignore
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.defer = true;
      script.onload = processEmbeds;
      document.body.appendChild(script);
    } else {
      processEmbeds();
    }
  }, [items]);

  if (!loading && !items.length) return null;

  const pauseCarousel = () => {
    if (home) setCarouselPaused(true);
  };

  const resumeCarousel = () => {
    if (home && !activePlayId) setCarouselPaused(false);
  };

  const skeletonCard = (key: string) => (
    <div
      key={key}
      className="w-[280px] shrink-0 bg-[#1e1b1a] aspect-[9/14] rounded-sm border border-white/5 animate-pulse flex flex-col justify-between p-4"
    >
      <div className="w-16 h-5 bg-white/10 rounded-full" />
      <div className="space-y-2">
        <div className="w-3/4 h-4 bg-white/10 rounded" />
        <div className="w-1/2 h-3 bg-white/10 rounded" />
      </div>
    </div>
  );

  const card = (item: Item, key: string) => {
    const isPlaying = activePlayId === key;
    const hasThumbnail = Boolean(item.thumbnailUrl);
    const posterUrl = item.thumbnailUrl || 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg';

    return (
      <div
        key={key}
        onMouseEnter={pauseCarousel}
        onFocus={pauseCarousel}
        onTouchStart={pauseCarousel}
        className="group relative w-[280px] shrink-0 bg-[#151211] aspect-[9/14] overflow-hidden rounded-sm border border-white/10 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
      >
        {item.mediaType === 'video' ? (
          <video
            src={item.url}
            poster={posterUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
            onPlay={pauseCarousel}
            onEnded={resumeCarousel}
            onPause={resumeCarousel}
          />
        ) : isPlaying ? (
          <>
            <iframe
              src={getInstagramEmbedUrl(item.url)}
              title={item.title || 'Instagram reel'}
              className="w-full h-full border-0"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
            />
            <button
              onClick={() => setActivePlayId(null)}
              className="absolute top-2 right-2 bg-black/70 text-white text-[10px] uppercase font-mono px-2 py-1 tracking-wider z-20 hover:bg-black"
            >
              Close
            </button>
          </>
        ) : (
          <div className="relative w-full h-full">
            {/* Visual Thumbnail Image */}
            <img
              src={posterUrl}
              alt={item.title || 'Instagram Reel'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#151211] via-transparent to-black/40 pointer-events-none" />

            {/* Instagram Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#E1306C]" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-white/90 font-medium">Reel</span>
            </div>

            {/* Center Play Button Overlay */}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={pauseCarousel}
              className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#C39E96]">
                <Play className="w-5 h-5 ml-0.5 fill-current text-white" />
              </div>
            </a>

            {/* Bottom Details & Link */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#151211] to-transparent">
              <h3 className="font-serif text-sm text-white line-clamp-1 mb-1 font-medium">
                {item.title || 'Indira Thakur Photography'}
              </h3>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                onClick={pauseCarousel}
                className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C39E96] hover:text-white transition-colors"
              >
                <span>View on Instagram</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={home ? 'py-16 overflow-hidden bg-[#151211]' : 'border-t border-[#E7DDD2] pt-14'}>
      <div className={home ? 'mb-8 text-center max-w-2xl mx-auto px-6' : 'mb-7'}>
        <p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#C39E96] mb-3">Instagram</p>
        <h2 className={home ? 'font-serif text-3xl text-white' : 'font-serif text-3xl text-[#2B2625]'}>
          {home ? 'Latest Reels' : `${category} Reels`}
        </h2>
        {home && carouselPaused && (
          <button onClick={resumeCarousel} className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#C39E96] hover:text-white transition-colors">
            Resume reel scroll
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex gap-5 overflow-x-hidden pb-4">
          {[1, 2, 3, 4].map((n) => skeletonCard(`skeleton-${n}`))}
        </div>
      ) : home ? (
        <div
          className="flex gap-5 w-max animate-[instagramScroll_45s_linear_infinite]"
          style={{ animationPlayState: carouselPaused ? 'paused' : 'running' }}
        >
          {[...items, ...items].map((item, index) => card(item, `${item._id}-${index}`))}
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">{items.map((item) => card(item, item._id))}</div>
      )}
      <style>{`
        @keyframes instagramScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[instagramScroll_45s_linear_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
