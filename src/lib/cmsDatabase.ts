import mongoose, { Model } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { verifyAuthUser, TokenUser } from '@/lib/auth';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function requireAdmin(request: Request): Promise<TokenUser> {
  // Deny-listed sources are rejected up front — BEFORE the authentication
  // flow — with 403 for every admin API route that calls this helper.
  const { assertIpNotBlocked } = await import('@/lib/security');
  await assertIpNotBlocked(request);

  // Admin access is DB-backed: the JWT signature must be valid AND the user
  // must still exist, be active, and carry the current authGeneration in
  // MongoDB. Revoked/old sessions (generation mismatch) are rejected here.
  // NOTE: role must be 'admin' EXACTLY; other role values return 403.
  const user = await verifyAuthUser(request);
  if (!user) {
    throw new ApiError('Unauthorized', 401);
  }
  if (user.role !== 'admin') {
    throw new ApiError('Forbidden', 403);
  }
  return user;
}

export async function connectDb(): Promise<typeof mongoose> {
  const db = await connectToDatabase();
  if (!db) {
    throw new ApiError('Database connection unavailable', 503);
  }
  return db;
}

export function isValidObjectId(id: unknown): id is string {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export function parseObjectId(id: unknown): mongoose.Types.ObjectId {
  if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError('Invalid id. Expected a valid 24-character ObjectId.', 400);
  }
  return new mongoose.Types.ObjectId(id);
}

function serializeValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      out[key] = serializeValue((value as Record<string, any>)[key]);
    }
    return out;
  }
  return value;
}

export function serializeDoc(doc: any): any {
  if (!doc || typeof doc !== 'object') return doc;
  const plain = doc.toObject ? doc.toObject() : doc;
  return serializeValue(plain);
}

function stripSystemFields(data: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = { ...data };
  delete clean._id;
  delete clean.id;
  delete clean.__v;
  delete clean.createdAt;
  delete clean.updatedAt;
  return clean;
}

export async function countAll(model: Model<any>, filter: Record<string, any> = {}): Promise<number> {
  await connectDb();
  return model.countDocuments(filter);
}

export async function findAll<T>(
  model: Model<any>,
  sort: Record<string, 1 | -1> = { order: 1, createdAt: -1 }
): Promise<T[]> {
  await connectDb();
  const docs = await model.find({}).sort(sort).lean();
  return docs.map((doc: any) => serializeDoc(doc)) as T[];
}

export async function findOneById<T>(model: Model<any>, id: unknown): Promise<T | null> {
  await connectDb();
  const objectId = parseObjectId(id);
  const doc = await model.findById(objectId).lean();
  return doc ? (serializeDoc(doc) as T) : null;
}

export async function createOne<T>(model: Model<any>, data: Record<string, any>): Promise<T> {
  await connectDb();
  const clean = stripSystemFields(data);
  const created = await model.create(clean);
  const fresh = await model.findById(created._id).lean();
  if (!fresh) {
    throw new ApiError('Read-after-write verification failed: created document was not found in MongoDB.', 500);
  }
  return serializeDoc(fresh) as T;
}

export async function updateOneById<T>(
  model: Model<any>,
  id: unknown,
  data: Record<string, any>
): Promise<T> {
  await connectDb();
  const objectId = parseObjectId(id);
  const clean = stripSystemFields(data);

  const updated = await model.findByIdAndUpdate(objectId, { $set: clean }, { new: true }).lean();
  if (!updated) {
    throw new ApiError('Record not found', 404);
  }

  const fresh = await model.findById(objectId).lean();
  if (!fresh) {
    throw new ApiError('Read-after-write verification failed: updated document was not found in MongoDB.', 500);
  }

  return serializeDoc(fresh) as T;
}

export async function deleteOneById(model: Model<any>, id: unknown): Promise<void> {
  await connectDb();
  const objectId = parseObjectId(id);

  const result = await model.deleteOne({ _id: objectId });
  if (result.deletedCount !== 1) {
    throw new ApiError('Record not found', 404);
  }

  const check = await model.findById(objectId).lean();
  if (check) {
    throw new ApiError('Read-after-write verification failed: record still exists in MongoDB.', 500);
  }
}

export async function upsertSingleton<T>(
  model: Model<any>,
  data: Record<string, any>,
  verifyKey: string
): Promise<T> {
  await connectDb();
  const clean = stripSystemFields(data);

  const saved = await model.findOneAndUpdate({}, { $set: clean }, { new: true, upsert: true }).lean();
  if (!saved) {
    throw new ApiError('MongoDB update query failed to persist document.', 500);
  }

  const fresh = await model.findOne({}).lean();
  if (!fresh) {
    throw new ApiError('Read-after-write verification failed: saved document was not found in MongoDB.', 500);
  }
  if (verifyKey && fresh[verifyKey] === undefined) {
    throw new ApiError('Read-after-write verification failed: persisted document is missing expected fields.', 500);
  }

  return serializeDoc(fresh) as T;
}

export async function fetchSingleton<T>(model: Model<any>): Promise<T | null> {
  await connectDb();
  const doc = await model.findOne({}).lean();
  return doc ? (serializeDoc(doc) as T) : null;
}
