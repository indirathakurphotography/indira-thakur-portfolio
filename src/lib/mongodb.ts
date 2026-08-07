import mongoose from 'mongoose';

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

export function getSanitizedMongoUri(rawUri?: string): string {
  const uri = rawUri || process.env.MONGODB_URI || '';
  if (!uri) return '';
  let cleaned = uri.trim().replace(/^["']|["']$/g, '');
  // Remove legacy authMechanism=SCRAM-SHA-1 if present as it causes bad auth on MongoDB Atlas driver in Vercel
  cleaned = cleaned.replace(/&authMechanism=SCRAM-SHA-1/gi, '').replace(/\?authMechanism=SCRAM-SHA-1&?/gi, '?');
  return cleaned;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const mongoUri = getSanitizedMongoUri();
  if (!mongoUri) {
    console.warn('MONGODB_URI environment variable is not configured');
    return null;
  }

  if (mongoose.connection.readyState === 1 && cached.conn) {
    return cached.conn;
  }

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch {}
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    autoIndex: true,
  };

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(mongoUri, opts);
    }
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    cached.conn = null;
    console.error('Database connection error using process.env.MONGODB_URI:', e?.message || e);
    return null;
  }

  return cached.conn;
}

