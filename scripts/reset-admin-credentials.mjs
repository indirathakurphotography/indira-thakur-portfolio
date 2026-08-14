/**
 * One-off, DB-backed admin credential reset.
 *
 * Usage (env-driven — NEVER pass the password on the command line):
 *   $env:MONGODB_URI="mongodb+srv://..."
 *   $env:NEW_ADMIN_PASSWORD="..."          # required
 *   $env:NEW_ADMIN_EMAIL="indirathakur@admin"  # optional, this is the default
 *   $env:NEW_ADMIN_NAME="Super Admin"      # optional
 *   node scripts/reset-admin-credentials.mjs
 *
 * What it does (preserves all CMS collections):
 *   1. Upserts the admin account (new bcrypt hash, cost 12).
 *   2. Deactivates every OTHER active admin/editor account (docs preserved).
 *   3. Sets a fresh authGeneration epoch on ALL users — every previously
 *      issued JWT becomes invalid on the next request.
 *   4. Marks all active login-log sessions as revoked.
 *   5. Prints a verification summary. NEVER prints the password.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI;
const password = process.env.NEW_ADMIN_PASSWORD;
const email = (process.env.NEW_ADMIN_EMAIL || 'indirathakur@admin').toLowerCase();
const name = process.env.NEW_ADMIN_NAME || 'Super Admin';

if (!uri) {
  console.error('ERROR: MONGODB_URI is required.');
  process.exit(1);
}
if (!password) {
  console.error('ERROR: NEW_ADMIN_PASSWORD is required.');
  process.exit(1);
}
if (!email.includes('@')) {
  console.error(`ERROR: invalid admin email '${email}'.`);
  process.exit(1);
}

async function main() {
  const started = Date.now();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  const users = db.collection('users');
  const loginLogs = db.collection('loginlogs');

  const hash = await bcrypt.hash(password, 12);
  const epoch = Date.now();
  const now = new Date();

  // 1. Upsert the admin account
  const upsert = await users.updateOne(
    { email },
    {
      $set: {
        email,
        name,
        role: 'admin',
        isActive: true,
        password: hash,
        authGeneration: epoch,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now, lastLogin: now },
    },
    { upsert: true }
  );

  // 2. Deactivate every other active account (admin or editor). Docs preserved.
  const deactivated = await users.updateMany(
    { email: { $ne: email }, isActive: true },
    { $set: { isActive: false, updatedAt: now } }
  );

  // 3. Uniform generation epoch on ALL users — invalidates every old JWT.
  const genBump = await users.updateMany({}, { $set: { authGeneration: epoch, updatedAt: now } });

  // 4. Mark all live login sessions as revoked.
  const revokedLogs = await loginLogs.updateMany(
    { status: 'success' },
    { $set: { status: 'revoked', logoutTime: now } }
  );

  // 5. Verification summary.
  const all = await users
    .find({}, { projection: { email: 1, role: 1, isActive: 1, authGeneration: 1, password: 1 } })
    .toArray();

  const activeAdmins = all.filter((u) => u.isActive === true && u.role === 'admin');
  const adminDoc = all.find((u) => u.email === email);

  const ok =
    upsert.upsertedCount + upsert.modifiedCount >= 1 &&
    activeAdmins.length === 1 &&
    activeAdmins[0]?.email === email &&
    activeAdmins[0]?.authGeneration === epoch;

  console.log('──────────────────────────────────────────────');
  console.log('Admin credential reset complete.');
  console.log('──────────────────────────────────────────────');
  console.log(`Admin account (active):    ${adminDoc ? adminDoc.email : 'MISSING'}`);
  console.log(`Role:                      ${adminDoc ? adminDoc.role : '-'}`);
  console.log(`authGeneration epoch:      ${adminDoc ? adminDoc.authGeneration : '-'}`);
  console.log(`Other accounts deactivated: ${deactivated.modifiedCount}`);
  console.log(`Login sessions revoked:     ${revokedLogs.modifiedCount}`);
  console.log(`Total accounts in DB:       ${all.length}`);
  console.log(`Active admins remaining:    ${activeAdmins.length}`);
  if (activeAdmins.length > 1) {
    console.log('  WARNING active admins:');
    for (const u of activeAdmins) console.log(`    - ${u.email}`);
  }
  console.log(`Password set (hashed):      ${adminDoc && adminDoc.password ? 'YES' : 'NO'}`);
  console.log(`RESULT: ${ok ? 'PASS' : 'FAIL'}`);
  console.log(`Elapsed: ${Date.now() - started}ms`);

  await mongoose.disconnect();
  process.exit(ok ? 0 : 1);
}

main().catch(async (err) => {
  console.error('RESET FAILED:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
