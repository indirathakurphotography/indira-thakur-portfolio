import fetch from 'node-fetch';

async function testPipeline() {
  console.log('=== TESTING MEDIA PIPELINE ON LIVE PRODUCTION ===\n');

  const testAssets = [
    {
      name: 'Brand Logo (Image)',
      path: '/api/media/brand/1786446222005-Indira_Photography_logo.jpeg',
      isVideo: false,
    },
    {
      name: 'Homepage Hero Slide 1 (Image)',
      path: '/api/media/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
      isVideo: false,
    },
    {
      name: 'Homepage Hero Slide 2 (Image)',
      path: '/api/media/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
      isVideo: false,
    },
    {
      name: 'Films Thumbnail (Image)',
      path: '/api/media/films/1785569204452-thumbnail.jpg',
      isVideo: false,
    },
    {
      name: 'Gallery Portrait (Image)',
      path: '/api/media/gallery/1785139692503-6V5A4996_copy.jpg',
      isVideo: false,
    },
    {
      name: 'About Founder Story (Image)',
      path: '/api/media/about/story/1785827668424-Indira.jpg',
      isVideo: false,
    },
  ];

  for (const asset of testAssets) {
    const fullUrl = `https://www.indirathakur.com${asset.path}`;
    console.log(`Testing: ${asset.name}`);
    console.log(`  URL: ${fullUrl}`);

    // 1. HEAD request
    const headRes = await fetch(fullUrl, { method: 'HEAD' });
    console.log(
      `  [HEAD] Status: ${headRes.status} | Content-Type: ${headRes.headers.get(
        'content-type'
      )} | Content-Length: ${headRes.headers.get('content-length')} bytes`
    );

    // 2. GET request
    const getRes = await fetch(fullUrl);
    const buf = await getRes.arrayBuffer();
    console.log(
      `  [GET]  Status: ${getRes.status} | Bytes Received: ${buf.byteLength} | Cache: ${getRes.headers.get(
        'x-vercel-cache'
      )}`
    );

    // 3. Range / 206 request
    const rangeRes = await fetch(fullUrl, { headers: { Range: 'bytes=0-1024' } });
    console.log(
      `  [RANGE] Status: ${rangeRes.status} | Content-Range: ${rangeRes.headers.get(
        'content-range'
      )} | Content-Length: ${rangeRes.headers.get('content-length')}`
    );
    console.log('');
  }

  // Also test video testimonials direct streaming / Range request
  console.log('Testing Video Testimonial Source Stream:');
  const videoUrl = 'https://files.catbox.moe/jpwiwi.mp4';
  try {
    const vHead = await fetch(videoUrl, { method: 'HEAD' });
    const vRange = await fetch(videoUrl, { headers: { Range: 'bytes=0-4096' } });
    console.log(
      `  [Video HEAD] Status: ${vHead.status} | Content-Type: ${vHead.headers.get(
        'content-type'
      )} | Length: ${vHead.headers.get('content-length')}`
    );
    console.log(
      `  [Video RANGE] Status: ${vRange.status} | Content-Range: ${vRange.headers.get(
        'content-range'
      )} | Length: ${vRange.headers.get('content-length')}`
    );
  } catch (e) {
    console.log(`  Video test error: ${e.message}`);
  }
}

testPipeline().catch(console.error);
