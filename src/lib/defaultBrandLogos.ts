// High-resolution vector SVG brand logos for luxury/fashion publications & clients
const svgToDataUrl = (svgString: string): string => {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim().replace(/\s+/g, ' '))}`;
};

const nightNightSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <rect width="320" height="80" fill="transparent"/>
  <g transform="translate(15, 10)">
    <circle cx="30" cy="30" r="26" fill="#2B2625"/>
    <path d="M30 8 A20 20 0 1 0 50 28 A24 24 0 1 1 30 8 Z" fill="#FAF6F3"/>
    <circle cx="42" cy="18" r="2.5" fill="#C39E96"/>
    <circle cx="20" cy="38" r="1.8" fill="#C39E96"/>
  </g>
  <text x="95" y="42" font-family="'Playfair Display', Georgia, serif" font-size="22" font-weight="700" fill="#2B2625" letter-spacing="3">NIGHT NIGHT</text>
  <text x="96" y="58" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600" fill="#7C706D" letter-spacing="4">LUXURY SLEEPWEAR</text>
</svg>
`;

const manbhariSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 80" width="360" height="80">
  <rect width="360" height="80" fill="transparent"/>
  <g transform="translate(10, 8)">
    <circle cx="32" cy="32" r="28" fill="#FAF6F3" stroke="#2B2625" stroke-width="2"/>
    <path d="M32 10 C20 24, 18 42, 32 54 C46 42, 44 24, 32 10 Z" fill="#2B2625"/>
    <circle cx="32" cy="30" r="6" fill="#C39E96"/>
  </g>
  <text x="82" y="40" font-family="'Playfair Display', Georgia, serif" font-size="20" font-weight="700" fill="#2B2625" letter-spacing="2">MANBHARI SAREES</text>
  <text x="83" y="56" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600" fill="#7C706D" letter-spacing="4">ROYAL HERITAGE WEAVES</text>
</svg>
`;

const reeoraSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 80" width="280" height="80">
  <rect width="280" height="80" fill="transparent"/>
  <g transform="translate(15, 12)">
    <rect x="2" y="2" width="52" height="52" rx="12" fill="#2B2625"/>
    <text x="28" y="38" font-family="'Playfair Display', Georgia, serif" font-size="32" font-weight="700" fill="#FAF6F3" text-anchor="middle">R</text>
  </g>
  <text x="88" y="44" font-family="'Playfair Display', Georgia, serif" font-size="26" font-weight="700" fill="#2B2625" letter-spacing="5">REEORA</text>
  <text x="89" y="59" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="600" fill="#7C706D" letter-spacing="5">COUTURE & STYLE</text>
</svg>
`;

const indieLoomSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" width="320" height="80">
  <rect width="320" height="80" fill="transparent"/>
  <g transform="translate(12, 10)">
    <rect x="0" y="0" width="56" height="56" rx="8" fill="#FAF6F3" stroke="#2B2625" stroke-width="1.5"/>
    <path d="M12 16 L44 16 M12 28 L44 28 M12 40 L44 40" stroke="#2B2625" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 10 L18 46 M30 10 L30 46 M42 10 L42 46" stroke="#C39E96" stroke-width="2" stroke-linecap="round"/>
  </g>
  <text x="86" y="41" font-family="'Playfair Display', Georgia, serif" font-size="22" font-weight="700" fill="#2B2625" letter-spacing="3">INDIE LOOM</text>
  <text x="87" y="57" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600" fill="#7C706D" letter-spacing="4">HANDCRAFTED TEXTILES</text>
</svg>
`;

export const DEFAULT_BRAND_LOGOS = {
  nightNight: svgToDataUrl(nightNightSvg),
  manbhariSarees: svgToDataUrl(manbhariSvg),
  reeora: svgToDataUrl(reeoraSvg),
  indieLoom: svgToDataUrl(indieLoomSvg),
};
