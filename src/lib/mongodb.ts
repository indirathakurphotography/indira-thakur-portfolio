import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: CachedConnection | undefined;
}

const cached: CachedConnection = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const mongoUri = process.env.MONGODB_URI || '';
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false, serverSelectionTimeoutMS: 5000, autoIndex: true };
    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  try {
    const { ensureAdminExists } = await import('@/models/User');
    await ensureAdminExists();
  } catch {
    // Admin seeding is best-effort
  }

  return cached.conn;
}
