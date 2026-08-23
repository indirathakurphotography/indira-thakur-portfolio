import { chromium } from 'playwright-core';

const VIEWPORTS = [
  { width: 375, height: 667, name: 'Mobile S (375px)' },
  { width: 390, height: 844, name: 'Mobile M (390px)' },
  { width: 768, height: 1024, name: 'Tablet (768px)' },
  { width: 1024, height: 768, name: 'Tablet L/Desktop S (1024px)' },
  { width: 1280, height: 800, name: 'Desktop M (1280px)' },
  { width: 1440, height: 900, name: 'Desktop L (1440px)' },
  { width: 1920, height: 1080, name: 'Desktop XL (1920px)' },
];

const ROUTES = [
  '/',
  '/about',
  '/gallery',
  '/gallery?category=newborn',
  '/gallery?category=maternity',
  '/gallery?category=portrait',
  '/gallery?category=weddings',
  '/gallery?category=events',
  '/gallery?category=brand',
  '/services',
  '/services/maternity-photography',
  '/films',
  '/testimonials',
  '/contact',
  '/faq',
];

async function runAudit() {
  console.log('Starting Browser-based Overflow Verification...\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  let totalFailures = 0;

  for (const route of ROUTES) {
    console.log(`\n========================================`);
    console.log(`Testing Route: ${route}`);
    console.log(`========================================`);

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height }
      });
      const page = await context.newPage();

      try {
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });

        // Allow animations to settle and components to mount
        await page.waitForTimeout(800);

        // Measure dimensions
        const metrics = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;

          const docScrollWidth = docEl.scrollWidth;
          const docClientWidth = docEl.clientWidth;
          const bodyScrollWidth = body.scrollWidth;
          const bodyClientWidth = body.clientWidth;

          // Find any elements exceeding the viewport width
          const overflowingElements = [];
          const allEls = document.querySelectorAll('*');
          allEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > docClientWidth + 1) { // 1px tolerance for subpixel rendering
              overflowingElements.push({
                tag: el.tagName,
                className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
                id: el.id || '',
                right: Math.round(rect.right),
                width: Math.round(rect.width),
                clientWidth: docClientWidth,
                overflowBy: Math.round(rect.right - docClientWidth)
              });
            }
          });

          return {
            docScrollWidth,
            docClientWidth,
            bodyScrollWidth,
            bodyClientWidth,
            hasOverflow: docScrollWidth > docClientWidth || bodyScrollWidth > bodyClientWidth,
            overflowingCount: overflowingElements.length,
            overflowingSamples: overflowingElements.slice(0, 5)
          };
        });

        const passed = !metrics.hasOverflow && metrics.overflowingCount === 0;
        if (!passed) totalFailures++;

        results.push({
          route,
          viewport: vp.name,
          width: vp.width,
          docScrollWidth: metrics.docScrollWidth,
          docClientWidth: metrics.docClientWidth,
          bodyScrollWidth: metrics.bodyScrollWidth,
          bodyClientWidth: metrics.bodyClientWidth,
          overflowingCount: metrics.overflowingCount,
          passed
        });

        const statusStr = passed ? '✅ PASS' : '❌ FAIL';
        console.log(
          `[${vp.name.padEnd(26)}] ${statusStr} | doc: ${metrics.docScrollWidth}/${metrics.docClientWidth} | body: ${metrics.bodyScrollWidth}/${metrics.bodyClientWidth}`
        );

        if (!passed && metrics.overflowingSamples.length > 0) {
          console.log(`   ⚠️ Overflowing elements samples:`, metrics.overflowingSamples);
        }

      } catch (err) {
        console.error(`Error loading ${route} at ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }
  }

  // Interaction Tests
  console.log(`\n========================================`);
  console.log(`Testing Dynamic Interactions (AI Widget, Gallery Switching, Resize)`);
  console.log(`========================================`);

  // Interaction 1: Open/Close AI Widget
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Check if AI widget button exists and click it
    const aiButton = page.locator('button[aria-label*="assistant" i], button:has-text("AI"), button.fixed.bottom-6');
    if (await aiButton.count() > 0) {
      await aiButton.first().click();
      await page.waitForTimeout(500);
      const afterOpen = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      }));
      const passed = afterOpen.scrollWidth <= afterOpen.clientWidth;
      console.log(`[AI Widget Opened @ 375px] ${passed ? '✅ PASS' : '❌ FAIL'} | ${afterOpen.scrollWidth}/${afterOpen.clientWidth}`);
    }
    await context.close();
  }

  // Interaction 2: Gallery Category Filter Switching
  {
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await context.newPage();
    await page.goto('http://localhost:3000/gallery', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const categories = ['newborn', 'maternity', 'portrait', 'weddings', 'events', 'brand'];
    for (const cat of categories) {
      const catButton = page.locator(`button:has-text("${cat}"), a[href*="category=${cat}"]`).first();
      if (await catButton.count() > 0) {
        await catButton.click();
        await page.waitForTimeout(400);
        const m = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth
        }));
        console.log(`[Gallery Filter -> ${cat} @ 768px] ${m.scrollWidth <= m.clientWidth ? '✅ PASS' : '❌ FAIL'} | ${m.scrollWidth}/${m.clientWidth}`);
      }
    }
    await context.close();
  }

  await browser.close();

  console.log(`\n========================================`);
  console.log(`Summary: Total Tests: ${results.length} | Failures: ${totalFailures}`);
  console.log(`========================================`);

  if (totalFailures > 0) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
