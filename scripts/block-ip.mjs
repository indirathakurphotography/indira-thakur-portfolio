import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('ERROR: MONGODB_URI is required.');
  process.exit(1);
}

const IP = process.argv[2] || '125.62.194.122';
const REASON = process.argv[3] || 'Unauthorized admin access source (hostile account creation + login brute-force)';

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;

const existing = await db.collection('blockedips').findOne({ ip: IP });
if (existing) {
  console.log(`IP ${IP} is already blocked (blockedBy=${existing.blockedBy}, reason=${existing.reason}).`);
  await mongoose.disconnect();
  process.exit(0);
}

await db.collection('blockedips').insertOne({
  ip: IP,
  reason: REASON,
  blockedBy: 'system',
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log(`Blocked IP ${IP} added to production denylist.`);

const count = await db.collection('blockedips').countDocuments();
console.log(`Total blocked IPs: ${count}`);

await mongoose.disconnect();
