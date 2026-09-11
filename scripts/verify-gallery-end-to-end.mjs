import jwt from 'jsonwebtoken';
import { normalizeCategory, formatCategory, isCategoryMatch } from '../src/lib/categoryUtils.ts';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-indira-photography-portfolio';

// Generate valid admin token matching auth.ts
const adminToken = jwt.sign(
  {
    userId: 'usr_admin_default',
    email: 'admin@indirathakur.com',
    role: 'admin',
    authGeneration: 1,
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${adminToken}`,
};

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
  } else {
    console.error(`❌ FAIL: ${desc}`);
    allPassed = false;
  }
}

async function runTests() {
  console.log('--- Step 1: Verify Category Unification & Normalization ---');
  assert("normalizeCategory('brand') is 'brand-collaboration'", normalizeCategory('brand') === 'brand-collaboration');
  assert("normalizeCategory('brand-collaboration') is 'brand-collaboration'", normalizeCategory('brand-collaboration') === 'brand-collaboration');
  assert("normalizeCategory('branding') is 'brand-collaboration'", normalizeCategory('branding') === 'brand-collaboration');
  assert("normalizeCategory('birth') is 'birth'", normalizeCategory('birth') === 'birth');
  assert("normalizeCategory('births') is 'birth'", normalizeCategory('births') === 'birth');
  assert("isCategoryMatch('brand', 'brand-collaboration')", isCategoryMatch('brand', 'brand-collaboration'));
  assert("isCategoryMatch('brand-collaboration', 'brand')", isCategoryMatch('brand-collaboration', 'brand'));
  assert("formatCategory('brand') is 'Brand Collaboration'", formatCategory('brand') === 'Brand Collaboration');
  assert("formatCategory('brand-collaboration') is 'Brand Collaboration'", formatCategory('brand-collaboration') === 'Brand Collaboration');
  assert("formatCategory('birth') is 'Birth'", formatCategory('birth') === 'Birth');

  console.log('\n--- Step 2: Fetch Current Gallery Settings (GET /api/gallery-settings) ---');
  const getRes = await fetch(`${BASE_URL}/api/gallery-settings`);
  assert('GET /api/gallery-settings returned 200', getRes.status === 200);
  const settings = await getRes.json();
  assert('Gallery settings has categoryIntroductions', !!settings.categoryIntroductions);
  assert("categoryIntroductions has 'brand-collaboration'", !!settings.categoryIntroductions['brand-collaboration']);
  assert("categoryIntroductions has 'birth'", !!settings.categoryIntroductions['birth']);
  console.log('  Current birth intro heading:', settings.categoryIntroductions['birth']?.heading);
  console.log('  Current brand-collaboration intro heading:', settings.categoryIntroductions['brand-collaboration']?.heading);

  console.log('\n--- Step 3: Save Updated Gallery Settings (PUT /api/gallery-settings) ---');
  const updatedSettings = {
    ...settings,
    heading: 'The Curated Fine Art Gallery',
    categoryIntroductions: {
      ...settings.categoryIntroductions,
      birth: {
        eyebrow: 'SACRED BEGINNINGS',
        heading: 'The Sacred Threshold of Birth',
        description: 'Documenting the raw, timeless miracle of new life with reverence, quiet intimacy, and grace.',
      },
      'brand-collaboration': {
        eyebrow: 'BRAND & VISUAL IDENTITY',
        heading: 'Elevated Editorial Visuals',
        description: 'Collaborating with bespoke lifestyle and luxury brands to craft iconic visual identities.',
      },
    },
  };

  const putRes = await fetch(`${BASE_URL}/api/gallery-settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updatedSettings),
  });
  assert('PUT /api/gallery-settings returned 200', putRes.status === 200);
  const putData = await putRes.json();
  assert("Saved birth intro heading matches", putData.categoryIntroductions?.birth?.heading === 'The Sacred Threshold of Birth');
  assert("Saved brand-collaboration intro matches", putData.categoryIntroductions?.['brand-collaboration']?.heading === 'Elevated Editorial Visuals');

  console.log('\n--- Step 4: Verify Persistence of Settings (GET /api/gallery-settings) ---');
  const getVerifyRes = await fetch(`${BASE_URL}/api/gallery-settings`);
  const verifiedSettings = await getVerifyRes.json();
  assert('Verified birth intro heading persisted', verifiedSettings.categoryIntroductions?.birth?.heading === 'The Sacred Threshold of Birth');
  assert('Verified brand-collaboration intro persisted', verifiedSettings.categoryIntroductions?.['brand-collaboration']?.heading === 'Elevated Editorial Visuals');

  console.log('\n--- Step 5: Add a Birth Category Image (POST /api/gallery-images) ---');
  const newBirthImage = {
    src: 'https://pub-2d6f7bfd0ebc4abdb3f3b9272fc47fa5.r2.dev/gallery/test-birth-miracle.webp',
    thumbnail: 'https://pub-2d6f7bfd0ebc4abdb3f3b9272fc47fa5.r2.dev/gallery/test-birth-miracle.webp',
    title: 'Threshold of Wonder',
    alt: 'Emotional birth photography documentary moment',
    category: 'birth',
    order: 999,
  };
  const addRes = await fetch(`${BASE_URL}/api/gallery-images`, {
    method: 'POST',
    headers,
    body: JSON.stringify(newBirthImage),
  });
  assert('POST /api/gallery-images returned 201 or 200', addRes.status === 200 || addRes.status === 201);
  const addedImage = await addRes.json();
  assert('Image created with valid _id', !!addedImage._id);
  assert("Image category is 'birth'", normalizeCategory(addedImage.category) === 'birth');
  const imageId = addedImage._id;

  console.log('\n--- Step 6: Update Image Details (PUT /api/gallery-images) ---');
  const updatePayload = {
    _id: imageId,
    title: 'Threshold of Wonder (Updated)',
    alt: 'Updated alt description for fine art birth portrait',
  };
  const updateRes = await fetch(`${BASE_URL}/api/gallery-images`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updatePayload),
  });
  assert('PUT /api/gallery-images returned 200', updateRes.status === 200);
  const updatedImage = await updateRes.json();
  assert('Image title was updated', updatedImage.title === 'Threshold of Wonder (Updated)');

  console.log('\n--- Step 7: Reorder Images (POST /api/gallery-images/reorder) ---');
  const reorderRes = await fetch(`${BASE_URL}/api/gallery-images/reorder`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orders: [
        { _id: imageId, id: imageId, order: 1 },
      ],
    }),
  });
  assert('POST /api/gallery-images/reorder returned 200', reorderRes.status === 200);

  console.log('\n--- Step 8: Delete Test Image (DELETE /api/gallery-images?id=...) ---');
  const deleteRes = await fetch(`${BASE_URL}/api/gallery-images?id=${imageId}`, {
    method: 'DELETE',
    headers,
  });
  assert('DELETE /api/gallery-images returned 200', deleteRes.status === 200);

  console.log('\n--- Step 9: Verify Image Deletion (GET /api/gallery-images) ---');
  const listRes = await fetch(`${BASE_URL}/api/gallery-images`);
  const listData = await listRes.json();
  const items = Array.isArray(listData) ? listData : listData.images || [];
  const found = items.some((item) => String(item._id) === String(imageId));
  assert('Deleted image is no longer in gallery items', !found);

  console.log('\n=======================================');
  if (allPassed) {
    console.log('🎉 ALL END-TO-END SANITY CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.error('❌ SOME CHECKS FAILED!');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
