import mongoose from 'mongoose';

// Disable buffering globally so Mongoose queries immediately fail or bypass if disconnected instead of waiting 10s
mongoose.set('bufferCommands', false);

interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  failedAt?: number;
}

declare global {
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
    return null;
  }

  // If connection failed recently (e.g. invalid URI or bad auth), avoid repeatedly retrying within 3 seconds
  if (cached.failedAt && Date.now() - cached.failedAt < 3000) {
    return null;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  if (mongoose.connection.readyState === 2 && cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch {
      cached.promise = null;
      cached.conn = null;
      cached.failedAt = Date.now();
      return null;
    }
  }

  mongoose.set('bufferCommands', false);

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 5000,
    autoIndex: false,
    dbName: 'indiraPhotography',
  };

  try {
    if (!cached.promise) {
      cached.promise = mongoose.connect(mongoUri, opts);
    }
    cached.conn = await cached.promise;
    cached.failedAt = undefined;
  } catch {
    cached.promise = null;
    cached.conn = null;
    cached.failedAt = Date.now();
    return null;
  }

  return cached.conn;
}

