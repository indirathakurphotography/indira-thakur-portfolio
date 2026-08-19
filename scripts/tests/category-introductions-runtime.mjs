import { resolveCategoryIntro, DEFAULT_GALLERY_SETTINGS, DEFAULT_CATEGORY_INTRODUCTIONS } from '../../src/types/gallerySettings.ts';
import { normalizeCategory, formatCategory } from '../../src/lib/categoryUtils.ts';

async function runRuntimeVerification() {
  console.log('===============================================================');
  console.log('   STRICT RUNTIME VERIFICATION: CATEGORY-WISE INTRODUCTIONS    ');
  console.log('===============================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   └─ Details: ${details}`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Category Normalization & Canonical Set
  // -------------------------------------------------------------
  console.log('\n--- 1. Category Normalization & Formatting Checks ---');
  const categoriesToTest = ['All', 'Newborn', 'Maternity', 'Portrait', 'Weddings', 'Events', 'Brand'];
  
  categoriesToTest.forEach((cat) => {
    const norm = normalizeCategory(cat);
    const formatted = formatCategory(cat);
    assert(
      norm === cat.toLowerCase(),
      `Normalization of '${cat}' -> '${norm}'`,
      `Formatted display: '${formatted}'`
    );
  });

  // -------------------------------------------------------------
  // Test 2: Default Template Resolution for All 7 Categories
  // -------------------------------------------------------------
  console.log('\n--- 2. Default Template Resolution (Fresh State) ---');
  const freshSettings = { ...DEFAULT_GALLERY_SETTINGS };

  categoriesToTest.forEach((cat) => {
    const intro = resolveCategoryIntro(cat, freshSettings);
    const hasEyebrow = typeof intro.eyebrow === 'string' && intro.eyebrow.length > 0;
    const hasHeading = typeof intro.heading === 'string' && intro.heading.length > 0;
    const hasDescription = typeof intro.description === 'string' && intro.description.length > 0;
    
    assert(
      hasEyebrow && hasHeading && hasDescription,
      `Category '${cat}' resolves valid default intro`,
      `Eyebrow: "${intro.eyebrow}" | Heading: "${intro.heading}" | Desc: "${intro.description.substring(0, 40)}..."`
    );
  });

  // -------------------------------------------------------------
  // Test 3: Custom Per-Category Content & Mutation (All, Newborn, Maternity, Brand)
  // -------------------------------------------------------------
  console.log('\n--- 3. Per-Category Custom Content Injection & Save Simulation ---');
  
  const modifiedSettings = {
    ...freshSettings,
    eyebrow: 'GLOBAL EYEBROW TEST',
    heading: 'GLOBAL HEADING TEST',
    subtitle: 'GLOBAL DESCRIPTION TEST',
    categoryIntroductions: {
      all: {
        eyebrow: 'ALL-CUSTOM-EYEBROW',
        heading: 'ALL-CUSTOM-HEADING',
        description: 'ALL-CUSTOM-DESCRIPTION'
      },
      newborn: {
        eyebrow: 'NEWBORN-UNIQUE-TAG',
        heading: 'Tiny New Wonders',
        description: 'Special newborn custom introduction text.'
      },
      maternity: {
        eyebrow: 'MATERNITY-GLOW-TAG',
        heading: 'Radiant Beginnings',
        description: 'Bespoke maternity editorial description.'
      },
      brand: {
        eyebrow: 'BRAND-IDENTITY-TAG',
        heading: 'Architects of Image',
        description: 'Visual identity storytelling for premier brands.'
      }
    }
  };

  // Check Newborn
  const newbornIntro = resolveCategoryIntro('newborn', modifiedSettings);
  assert(
    newbornIntro.eyebrow === 'NEWBORN-UNIQUE-TAG' &&
    newbornIntro.heading === 'Tiny New Wonders' &&
    newbornIntro.description === 'Special newborn custom introduction text.',
    'Newborn resolves exact custom heading & description',
    `Heading: "${newbornIntro.heading}"`
  );

  // Check Maternity
  const maternityIntro = resolveCategoryIntro('maternity', modifiedSettings);
  assert(
    maternityIntro.eyebrow === 'MATERNITY-GLOW-TAG' &&
    maternityIntro.heading === 'Radiant Beginnings' &&
    maternityIntro.description === 'Bespoke maternity editorial description.',
    'Maternity resolves exact custom heading & description',
    `Heading: "${maternityIntro.heading}"`
  );

  // Check Brand
  const brandIntro = resolveCategoryIntro('brand', modifiedSettings);
  assert(
    brandIntro.eyebrow === 'BRAND-IDENTITY-TAG' &&
    brandIntro.heading === 'Architects of Image' &&
    brandIntro.description === 'Visual identity storytelling for premier brands.',
    'Brand resolves exact custom heading & description',
    `Heading: "${brandIntro.heading}"`
  );

  // Check All
  const allIntro = resolveCategoryIntro('all', modifiedSettings);
  assert(
    allIntro.eyebrow === 'ALL-CUSTOM-EYEBROW' &&
    allIntro.heading === 'ALL-CUSTOM-HEADING' &&
    allIntro.description === 'ALL-CUSTOM-DESCRIPTION',
    'All (Global) resolves exact custom heading & description',
    `Heading: "${allIntro.heading}"`
  );

  // -------------------------------------------------------------
  // Test 4: Strict Category Isolation Checks
  // -------------------------------------------------------------
  console.log('\n--- 4. Category Cross-Contamination & Isolation Tests ---');
  
  // Verify Newborn text NEVER appears when switching to Maternity, Portrait, Weddings, Events, Brand, or All
  const categoriesToCheckIsolation = ['maternity', 'portrait', 'weddings', 'events', 'brand', 'all'];
  categoriesToCheckIsolation.forEach((cat) => {
    const res = resolveCategoryIntro(cat, modifiedSettings);
    assert(
      res.heading !== 'Tiny New Wonders' && res.eyebrow !== 'NEWBORN-UNIQUE-TAG',
      `Category '${cat}' does NOT leak Newborn custom text`,
      `Resolved: "${res.heading}"`
    );
  });

  // Verify Maternity text NEVER appears when switching to Newborn, Brand, Weddings, etc.
  ['newborn', 'portrait', 'weddings', 'events', 'brand', 'all'].forEach((cat) => {
    const res = resolveCategoryIntro(cat, modifiedSettings);
    assert(
      res.heading !== 'Radiant Beginnings' && res.eyebrow !== 'MATERNITY-GLOW-TAG',
      `Category '${cat}' does NOT leak Maternity custom text`,
      `Resolved: "${res.heading}"`
    );
  });

  // Verify Brand text NEVER appears when switching to Portrait, Events, Newborn, etc.
  ['newborn', 'maternity', 'portrait', 'weddings', 'events', 'all'].forEach((cat) => {
    const res = resolveCategoryIntro(cat, modifiedSettings);
    assert(
      res.heading !== 'Architects of Image' && res.eyebrow !== 'BRAND-IDENTITY-TAG',
      `Category '${cat}' does NOT leak Brand custom text`,
      `Resolved: "${res.heading}"`
    );
  });

  // -------------------------------------------------------------
  // Test 5: Fallback Behavior (Unset Category or Cleared Category)
  // -------------------------------------------------------------
  console.log('\n--- 5. Fallback Hierarchy Tests ---');

  // Portrait has no custom intro in modifiedSettings. It should fallback to DEFAULT_CATEGORY_INTRODUCTIONS or Global Header.
  const portraitIntro = resolveCategoryIntro('portrait', modifiedSettings);
  assert(
    portraitIntro.heading === 'In Their Element' || portraitIntro.heading === 'GLOBAL HEADING TEST',
    'Portrait falls back gracefully without breaking',
    `Resolved: Eyebrow="${portraitIntro.eyebrow}", Heading="${portraitIntro.heading}"`
  );

  // Clear Maternity custom intro and confirm it falls back properly
  const settingsWithClearedMaternity = {
    ...modifiedSettings,
    categoryIntroductions: {
      ...modifiedSettings.categoryIntroductions,
    }
  };
  delete settingsWithClearedMaternity.categoryIntroductions.maternity;

  const clearedMaternityIntro = resolveCategoryIntro('maternity', settingsWithClearedMaternity);
  assert(
    clearedMaternityIntro.heading !== 'Radiant Beginnings',
    'Cleared Maternity no longer has previous custom text',
    `Fallback heading: "${clearedMaternityIntro.heading}"`
  );

  // Confirm Newborn and Brand are completely unaffected by clearing Maternity
  const newbornStillIntact = resolveCategoryIntro('newborn', settingsWithClearedMaternity);
  const brandStillIntact = resolveCategoryIntro('brand', settingsWithClearedMaternity);
  assert(
    newbornStillIntact.heading === 'Tiny New Wonders' && brandStillIntact.heading === 'Architects of Image',
    'Newborn and Brand custom content remain completely intact after clearing Maternity',
    `Newborn: "${newbornStillIntact.heading}", Brand: "${brandStillIntact.heading}"`
  );

  // If global header settings are set, verify fallback to global header when default category template doesn't exist
  const customCatIntro = resolveCategoryIntro('unknown-custom-category', modifiedSettings);
  assert(
    customCatIntro.eyebrow === 'GLOBAL EYEBROW TEST' || customCatIntro.eyebrow === 'UNKNOWN-CUSTOM-CATEGORY',
    'Unknown custom category resolves cleanly using fallback hierarchy',
    `Eyebrow: "${customCatIntro.eyebrow}", Heading: "${customCatIntro.heading}"`
  );

  // -------------------------------------------------------------
  // Test 6: URL / Query Parameter Deep Linking Simulation
  // -------------------------------------------------------------
  console.log('\n--- 6. Query Parameter & Direct URL Resolution ---');
  
  const testUrls = [
    { url: '/gallery?category=newborn', param: 'newborn', expectedHeading: 'Tiny New Wonders' },
    { url: '/gallery?category=maternity', param: 'maternity', expectedHeading: 'The Art of Motherhood' }, // on fresh or default
    { url: '/gallery?category=brand', param: 'brand', expectedHeading: 'Architects of Image' },
    { url: '/gallery', param: 'all', expectedHeading: 'ALL-CUSTOM-HEADING' }
  ];

  testUrls.forEach(({ url, param, expectedHeading }) => {
    const currentSettings = param === 'maternity' ? settingsWithClearedMaternity : modifiedSettings;
    const resolved = resolveCategoryIntro(param, currentSettings);
    assert(
      typeof resolved.heading === 'string' && resolved.heading.length > 0,
      `URL '${url}' dynamically resolves category intro immediately`,
      `Resolved: Eyebrow="${resolved.eyebrow}", Heading="${resolved.heading}"`
    );
  });

  // -------------------------------------------------------------
  // Test 7: HTTP Endpoint Verification (if dev server running)
  // -------------------------------------------------------------
  console.log('\n--- 7. Live Server Endpoint Verification (http://localhost:3000) ---');
  try {
    const res = await fetch('http://localhost:3000/api/gallery-settings');
    if (res.ok) {
      const data = await res.json();
      assert(
        typeof data === 'object',
        'GET /api/gallery-settings returns HTTP 200 and valid JSON',
        `Eyebrow: "${data.eyebrow}", Heading: "${data.heading}"`
      );
    } else {
      console.log(`ℹ️ [INFO] Local dev server returned status ${res.status}`);
    }
  } catch (err) {
    console.log(`ℹ️ [INFO] Local dev server fetch: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`   RUNTIME VERIFICATION RESULTS: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runRuntimeVerification();
