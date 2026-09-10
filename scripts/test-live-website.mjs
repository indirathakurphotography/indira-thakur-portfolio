import fetch from 'node-fetch';

const PAGES_TO_TEST = [
  '/',
  '/about',
  '/services',
  '/services/maternity-photography',
  '/services/newborn-photography',
  '/gallery',
  '/films',
  '/contact',
  '/book-now',
  '/pricing',
  '/reviews',
];

async function testWebsite() {
  console.log('=== AUDITING LIVE WEBSITE PAGES FOR BROKEN ASSETS ===\n');

  let hasErrors = false;

  for (const path of PAGES_TO_TEST) {
    const url = `https://www.indirathakur.com${path}`;
    try {
      const res = await fetch(url);
      console.log(`Page: ${path} -> Status: ${res.status}`);
      if (!res.ok) {
        console.error(`  ERROR: Page returned ${res.status}`);
        hasErrors = true;
        continue;
      }

      const html = await res.text();
      // Check if html contains any broken supabase references
      const supabaseMatches = html.match(/https?:\/\/[a-zA-Z0-9_-]+\.supabase\.co[^\s"'>]*/g) || [];
      if (supabaseMatches.length > 0) {
        console.warn(`  WARNING: Found ${supabaseMatches.length} Supabase URLs on ${path}:`);
        for (const sm of supabaseMatches) {
          console.warn(`    - ${sm}`);
        }
      } else {
        console.log(`  CLEAN: 0 Supabase URLs found.`);
      }

      // Find all /api/media/ URLs rendered on this page and test them
      const mediaMatches = html.match(/\/api\/media\/[^\s"'>]+/g) || [];
      const uniqueMedia = Array.from(new Set(mediaMatches));
      console.log(`  Found ${uniqueMedia.length} media proxy URLs.`);

      for (const mUrl of uniqueMedia) {
        const fullMediaUrl = `https://www.indirathakur.com${mUrl}`;
        const mRes = await fetch(fullMediaUrl, { method: 'HEAD' });
        if (!mRes.ok) {
          console.error(`  BROKEN MEDIA: ${mUrl} returned ${mRes.status}`);
          hasErrors = true;
        }
      }
    } catch (err) {
      console.error(`  Error testing ${path}:`, err.message);
      hasErrors = true;
    }
  }

  console.log('\n=============================================');
  if (hasErrors) {
    console.error('AUDIT FINISHED: Some issues were detected.');
  } else {
    console.log('AUDIT FINISHED: ALL PAGES AND MEDIA ASSETS 100% HEALTHY!');
  }
  console.log('=============================================\n');
}

testWebsite().catch(console.error);
