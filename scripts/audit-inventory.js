const fs = require('fs');
const path = require('path');

const siteData = JSON.parse(fs.readFileSync('/tmp/all_site_data.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('/tmp/prod_audit.json', 'utf8'));

const allSupabaseUrls = new Set();

function extractUrls(obj) {
  if (!obj) return;
  if (typeof obj === 'string') {
    if (obj.includes('supabase.co/storage/v1/object')) {
      // Clean trailing quotes or spaces
      const clean = obj.replace(/[)"',;]+$/, '');
      allSupabaseUrls.add(clean);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(extractUrls);
  } else if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      extractUrls(obj[k]);
    }
  }
}

// 1. Extract from siteData
extractUrls(siteData);

// 2. Extract from audit
extractUrls(audit);

// 3. Scan src/ and scripts/
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== '.next') scanDir(full);
    } else if (/\.(tsx?|jsx?|json|mjs)$/.test(f)) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = content.match(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/storage\/v1\/object\/[^\s"'\`\)\],]+/g) || [];
      matches.forEach(m => allSupabaseUrls.add(m.replace(/[)"',;]+$/, '')));
    }
  }
}
scanDir('./src');
scanDir('./scripts');

console.log('Total unique Supabase URLs found:', allSupabaseUrls.size);

// Group by section
const bySection = {
  hero: [],
  brand_logo: [],
  about: [],
  services: [],
  gallery: [],
  films: [],
  seo: [],
  testimonials: [],
  other: []
};

for (const url of allSupabaseUrls) {
  const m = url.match(/\/images\/(.+)$/);
  const key = m ? m[1] : url;
  if (key.includes('home/hero') || key.includes('slideshow')) bySection.hero.push({ url, key });
  else if (key.includes('brand') || key.includes('logo')) bySection.brand_logo.push({ url, key });
  else if (key.includes('about')) bySection.about.push({ url, key });
  else if (key.includes('services')) bySection.services.push({ url, key });
  else if (key.includes('gallery')) bySection.gallery.push({ url, key });
  else if (key.includes('films') || key.includes('videos')) bySection.films.push({ url, key });
  else if (key.includes('seo')) bySection.seo.push({ url, key });
  else if (key.includes('testimonials')) bySection.testimonials.push({ url, key });
  else bySection.other.push({ url, key });
}

console.log('Breakdown by section:');
for (const [s, items] of Object.entries(bySection)) {
  console.log(`  ${s}: ${items.length}`);
}

fs.writeFileSync('/tmp/supabase_inventory.json', JSON.stringify({
  total: allSupabaseUrls.size,
  bySection,
  allUrls: Array.from(allSupabaseUrls)
}, null, 2));
