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

function normalizeMongoUri(uri: string): string {
  if (!uri) return uri;
  try {
    const match = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const prefix = match[1];
      const user = match[2];
      const pass = match[3];
      const rest = match[4];

      const decodedUser = decodeURIComponent(user);
      const decodedPass = decodeURIComponent(pass);
      const encodedUser = encodeURIComponent(decodedUser);
      const encodedPass = encodeURIComponent(decodedPass);

      return `${prefix}${encodedUser}:${encodedPass}@${rest}`;
    }
  } catch {
    // Return original uri if regex/parsing fails
  }
  return uri;
}

const TARGET_URI = 'mongodb+srv://lokeshnaivaidya_db_user:Lokeshlucky@cluster0.exhxp2b.mongodb.net/indiraPhotography?retryWrites=true&w=majority&appName=Cluster0';

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  const mongoUri = process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('Lokeshlucky81') 
    ? process.env.MONGODB_URI 
    : TARGET_URI;

  const normalizedUri = normalizeMongoUri(mongoUri.trim());

  if (!cached.promise) {
    const opts = { bufferCommands: false, serverSelectionTimeoutMS: 10000, autoIndex: true };
    cached.promise = mongoose.connect(normalizedUri, opts).then((m) => m);
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

