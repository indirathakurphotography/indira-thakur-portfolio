import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../src/lib/mongodb.ts';
import GalleryImage from '../src/models/GalleryImage.ts';
import Gallery from '../src/models/Gallery.ts';
import FileRecord from '../src/models/FileRecord.ts';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-indira-photography-portfolio';

// Session 1 Admin Token
const adminTokenSession1 = jwt.sign(
  {
    userId: 'usr_admin_default',
    email: 'admin@indirathakur.com',
    role: 'admin',
    sessionId: 'session_alpha_1',
    authGeneration: 1,
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

// Session 2 Admin Token (distinct browser session/device)
const adminTokenSession2 = jwt.sign(
  {
    userId: 'usr_admin_default',
    email: 'admin@indirathakur.com',
    role: 'admin',
    sessionId: 'session_beta_2',
    authGeneration: 1,
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`✅ PASS: ${desc}`);
  } else {
    console.error(`❌ FAIL: ${desc}`);
    allPassed = false;
  }
}

async function runTest() {
  console.log('--- Multi-Session & Database Persistence Verification ---');

  // Step 1: Session 1 creates a new image
  const uniqueKey = `test-del-${Date.now()}`;
  const newImageData = {
    src: `https://pub-2d6f7bfd0ebc4abdb3f3b9272fc47fa5.r2.dev/gallery/${uniqueKey}.webp`,
    publicId: `gallery/${uniqueKey}.webp`,
    thumbnail: `https://pub-2d6f7bfd0ebc4abdb3f3b9272fc47fa5.r2.dev/gallery/${uniqueKey}.webp`,
    title: 'Multi-Session Persistence Test Photo',
    alt: 'Testing persistent deletion across sessions',
    category: 'weddings',
    order: 50,
  };

  const createRes = await fetch(`${BASE_URL}/api/gallery-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminTokenSession1}`,
    },
    body: JSON.stringify(newImageData),
  });

  const responseText = await createRes.text();
  console.log('Create response status:', createRes.status, 'body:', responseText);
  let createdItem = {};
  try {
    createdItem = JSON.parse(responseText);
  } catch {}
  const imageId = createdItem._id;
  assert('Created item has valid ID', !!imageId);
  console.log(`  Created image ID: ${imageId}`);

  // Verify in MongoDB directly
  const db = await connectToDatabase();
  let foundInMongo = null;
  if (db && /^[0-9a-fA-F]{24}$/.test(imageId)) {
    foundInMongo = await GalleryImage.findById(imageId).lean();
    assert('Image confirmed saved in MongoDB GalleryImage', !!foundInMongo);
  }

  // Step 2: Session 2 (distinct account/token) fetches gallery items and sees the image
  const session2GetBefore = await fetch(`${BASE_URL}/api/gallery-images?limit=1000`, {
    headers: {
      Authorization: `Bearer ${adminTokenSession2}`,
      'Cache-Control': 'no-cache',
    },
  });
  const dataBefore = await session2GetBefore.json();
  const itemsBefore = dataBefore.items || [];
  const foundBySession2Before = itemsBefore.some((item) => String(item._id) === String(imageId));
  assert('Session 2 initially sees the new image in the gallery', foundBySession2Before);

  // Step 3: Session 1 deletes the image
  console.log(`\nDeleting image ${imageId} from Session 1...`);
  const deleteRes = await fetch(`${BASE_URL}/api/gallery-images?id=${imageId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${adminTokenSession1}`,
    },
  });
  assert('Session 1 DELETE API returned 200', deleteRes.status === 200);

  // Step 4: Verify directly in MongoDB that the record is gone
  if (db && /^[0-9a-fA-F]{24}$/.test(imageId)) {
    const afterMongo = await GalleryImage.findById(imageId).lean();
    assert('MongoDB GalleryImage record is completely removed (null)', afterMongo === null);

    const afterGallery = await Gallery.findById(imageId).lean();
    assert('MongoDB Gallery record is completely removed (null)', afterGallery === null);
  }

  // Step 5: Session 2 queries gallery in a new request (simulating logging in on another device/session)
  console.log('\nQuerying from Session 2 after deletion...');
  const session2GetAfter = await fetch(`${BASE_URL}/api/gallery-images?limit=1000`, {
    headers: {
      Authorization: `Bearer ${adminTokenSession2}`,
      'Cache-Control': 'no-cache, no-store',
    },
  });
  const dataAfter = await session2GetAfter.json();
  const itemsAfter = dataAfter.items || [];
  const foundBySession2After = itemsAfter.some((item) => String(item._id) === String(imageId));
  assert('Session 2 DOES NOT see the deleted image (persisted across sessions)', !foundBySession2After);

  console.log('\n=======================================');
  if (allPassed) {
    console.log('🎉 MULTI-SESSION PERSISTENCE VERIFIED SUCCESSFULLY!');
  } else {
    console.error('❌ MULTI-SESSION PERSISTENCE TEST FAILED!');
    process.exit(1);
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
