import fetch from 'node-fetch';

const MIGRATION_PAIRS = [
  {
    targetKey: 'films/1785569204452-thumbnail.jpg',
    sourceKey: 'gallery/1785139692503-6V5A4996_copy.jpg', // Fine wedding portrait
    description: 'Films thumbnail (wedding fine art)',
  },
  {
    targetKey: 'home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    sourceKey: 'gallery/1785139716023-6V5A5898_copy.jpg', // Wedding portraits
    description: 'Hero slide 1: Wedding Portraits',
  },
  {
    targetKey: 'home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    sourceKey: 'gallery/1785140379137-Farm_3-_girl.jpg', // Newborn / child portrait
    description: 'Hero slide 2: Newborn & Family',
  },
  {
    targetKey: 'home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    sourceKey: 'gallery/1785140817873-Heart_3.jpg', // Family / toddler
    description: 'Hero slide 3: Family Shoot',
  },
  {
    targetKey: 'home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    sourceKey: 'gallery/1785139866529-6V5A5995_copy.jpg', // Wedding celebration
    description: 'Hero slide 4: Wedding Celebration',
  },
  {
    targetKey: 'home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    sourceKey: 'gallery/1785140238073-Beach_1-_boy.jpg', // Event / ceremony
    description: 'Hero slide 5: Naming Ceremony / Event',
  },
  {
    targetKey: 'home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    sourceKey: 'gallery/1785140835816-IMG_0027.jpg', // Newborn family shoot
    description: 'Hero slide 6: Infant portrait',
  },
  {
    targetKey: 'home/hero/slideshow/1785524162837-maternity.jpg',
    sourceKey: 'gallery/1785146118165-IMG_6335_copy.jpg', // Fine art portrait / maternity
    description: 'Hero slide 7: Maternity Fine Art',
  },
  {
    targetKey: 'home/hero/slideshow/1785573149313-47.jpg',
    sourceKey: 'gallery/1785160171037-17.jpg', // Fine art 47
    description: 'Hero slide 8: Fine Art 47',
  },
  {
    targetKey: 'home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    sourceKey: 'gallery/1785146255500-IMG_7295_bw_copy.jpg', // B&W Artistic portrait
    description: 'Hero slide 9: Black & White Fine Art',
  },
  {
    targetKey: 'services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    sourceKey: 'gallery/1785140281609-Beach_1.jpg', // Nature / outdoor maternity
    description: 'Services: Maternity shoot in nature',
  },
  {
    targetKey: 'videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
    sourceKey: 'services/brand-collaboration/1785139459525-IMG_9808_copy.jpg', // Commercial brand storytelling
    description: 'Video Testimonial Thumbnail: Commercial Storytelling',
  },
];

async function run() {
  console.log('Logging in to live production API...');
  const loginRes = await fetch('https://www.indirathakur.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@indirathakur.com', password: 'Admin@12345678' }),
  });
  const { token } = await loginRes.json();
  if (!token) throw new Error('Failed to obtain admin token');
  console.log('Logged in successfully.\n');

  let successCount = 0;
  let failCount = 0;

  for (const pair of MIGRATION_PAIRS) {
    console.log(`Processing: ${pair.targetKey} (${pair.description})`);
    try {
      // 1. Fetch source image buffer from live R2 media proxy
      const srcUrl = `https://www.indirathakur.com/api/media/${pair.sourceKey}`;
      const srcRes = await fetch(srcUrl);
      if (!srcRes.ok) {
        console.error(`  Failed to fetch source ${srcUrl}: ${srcRes.status}`);
        failCount++;
        continue;
      }
      const buffer = Buffer.from(await srcRes.arrayBuffer());
      const contentType = srcRes.headers.get('content-type') || 'image/jpeg';
      console.log(`  Fetched source (${buffer.length} bytes, ${contentType})`);

      // 2. Upload to Cloudflare R2 under targetKey
      const upRes = await fetch('https://www.indirathakur.com/api/migrate-r2', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload_asset',
          key: pair.targetKey,
          base64: buffer.toString('base64'),
          contentType,
        }),
      });
      const upData = await upRes.json();
      if (!upData.success) {
        console.error(`  Upload failed:`, upData);
        failCount++;
        continue;
      }

      // 3. Immediately verify the uploaded targetKey in R2 with GET and HEAD
      const getRes = await fetch(`https://www.indirathakur.com/api/media/${pair.targetKey}`);
      const headRes = await fetch(`https://www.indirathakur.com/api/media/${pair.targetKey}`, {
        method: 'HEAD',
      });
      const rangeRes = await fetch(`https://www.indirathakur.com/api/media/${pair.targetKey}`, {
        headers: { Range: 'bytes=0-100' },
      });

      console.log(
        `  VERIFIED in R2 -> GET: ${getRes.status} (${getRes.headers.get(
          'content-length'
        )} bytes), HEAD: ${headRes.status}, RANGE: ${rangeRes.status}`
      );
      successCount++;
    } catch (err) {
      console.error(`  Error on ${pair.targetKey}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration Complete: ${successCount} succeeded, ${failCount} failed.`);
  console.log(`========================================\n`);
}

run().catch(console.error);
