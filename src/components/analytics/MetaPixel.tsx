'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';

interface MetaPixelProps {
  initialPixelId?: string;
}

function MetaPixelTracker({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstMount = useRef(true);

  // Track PageView on client-side route changes
  useEffect(() => {
    if (!pixelId || !pathname) return;

    // Skip admin or API routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, pixelId]);

  return null;
}

export default function MetaPixel({ initialPixelId }: MetaPixelProps) {
  const [pixelId, setPixelId] = useState<string>(
    initialPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
  );
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // If pixelId already present from env/props, no need to fetch
    if (pixelId) {
      setInitialized(true);
      return;
    }

    // Otherwise, fetch from SEO settings in MongoDB
    let mounted = true;
    fetch('/api/seo', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data) return;
        const dbPixelId = data.metaPixelId || '';
        if (dbPixelId) {
          setPixelId(dbPixelId.trim());
        }
        setInitialized(true);
      })
      .catch(() => {
        if (mounted) setInitialized(true);
      });

    return () => {
      mounted = false;
    };
  }, [pixelId]);

  // Clean pixel ID without surrounding spaces
  const cleanPixelId = pixelId?.trim();

  // If no Pixel ID configured, do not inject scripts or fake IDs
  if (!cleanPixelId) {
    return null;
  }

  return (
    <>
      {/* Meta Pixel Base Script */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${cleanPixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* Noscript fallback for non-JS environments */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${cleanPixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* PageView listener on client routing */}
      <Suspense fallback={null}>
        <MetaPixelTracker pixelId={cleanPixelId} />
      </Suspense>
    </>
  );
}
