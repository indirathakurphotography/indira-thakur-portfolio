import { Suspense } from 'react';
import MetaPixelTracker from './MetaPixelTracker';
import { SITE_METADATA } from '@/lib/seoConfig';

interface MetaPixelProps {
  initialPixelId?: string;
}

export default function MetaPixel({ initialPixelId }: MetaPixelProps) {
  const pixelId = (
    initialPixelId ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    SITE_METADATA.metaPixelId ||
    '1533647998184514'
  ).trim();

  if (!pixelId) {
    return null;
  }

  return (
    <>
      {/* Official Meta Pixel Base Code (executed synchronously on initial HTML parse) */}
      <script
        id="meta-pixel-base"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${pixelId}');fbq('track', 'PageView');`,
        }}
      />

      {/* Official Noscript Image Fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Client-Side Route Change Tracker for Next.js SPA Navigation */}
      <Suspense fallback={null}>
        <MetaPixelTracker />
      </Suspense>
    </>
  );
}
