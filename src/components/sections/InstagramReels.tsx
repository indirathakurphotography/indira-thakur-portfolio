'use client';

import { useEffect, useState } from 'react';

type Item = {
  _id: string;
  title: string;
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
    const rawMediaType = parts[mediaTypeIndex]?.toLowerCase();
    const mediaType = rawMediaType === 'reels' ? 'reel' : rawMediaType;

    if (!shortcode || !mediaType) return url;
    return `https://www.instagram.com/${mediaType}/${shortcode}/embed/`;
  } catch {
    return url;
  }
}

export default function InstagramReels({ category, home = false }: { category: string; home?: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [carouselPaused, setCarouselPaused] = useState(false);

  useEffect(() => {
    fetch(`/api/instagram-links?category=${encodeURIComponent(category)}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [category]);

  if (!items.length) return null;

  const pauseCarousel = () => {
    if (home) setCarouselPaused(true);
  };

  const resumeCarousel = () => {
    if (home) setCarouselPaused(false);
  };

  const card = (item: Item, key: string) => (
    <div
      key={key}
      onMouseEnter={pauseCarousel}
      onFocus={pauseCarousel}
      onTouchStart={pauseCarousel}
      className="w-[280px] shrink-0 bg-[#151211] aspect-[9/14] overflow-hidden relative"
    >
      {item.mediaType === 'video' ? (
        <video
          src={item.url}
          poster={item.thumbnailUrl}
          controls
          className="w-full h-full object-cover"
          onPlay={pauseCarousel}
          onEnded={resumeCarousel}
          onPause={resumeCarousel}
        />
      ) : (
        <>
          <iframe
            src={getInstagramEmbedUrl(item.url)}
            title={item.title || 'Instagram reel'}
            className="w-full h-full border-0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            onClick={pauseCarousel}
            className="absolute bottom-0 left-0 right-0 bg-[#151211]/90 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-white/80 hover:text-white transition-colors"
          >
            Open on Instagram
          </a>
        </>
      )}
    </div>
  );

  return (
    <section className={home ? 'py-16 overflow-hidden bg-[#151211]' : 'border-t border-[#E7DDD2] pt-14'}>
      <div className={home ? 'mb-8 text-center' : 'mb-7'}>
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
      {home ? (
        <div
          className="flex gap-5 w-max animate-[instagramScroll_45s_linear_infinite]"
          style={{ animationPlayState: carouselPaused ? 'paused' : 'running' }}
        >
          {[...items, ...items].map((item, index) => card(item, `${item._id}-${index}`))}
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4">{items.map((item) => card(item, item._id))}</div>
      )}
      <style>{'@keyframes instagramScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }'}</style>
    </section>
  );
}
