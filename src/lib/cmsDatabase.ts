import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

/** Error type translated by CMS route handlers into an honest HTTP response. */
export class CmsError extends Error {
  constructor(message: string, public readonly status = 500) {
    super(message);
    this.name = 'CmsError';
  }
}

export async function requireDatabase() {
  const connection = await connectToDatabase();
  if (!connection || connection.connection.readyState !== 1) {
    throw new CmsError('MongoDB is unavailable. No changes were saved.', 503);
  }
  return connection;
}

/**
 * IDs cross the HTTP boundary as strings only.  Reject BSON buffers, objects,
 * temporary fallback IDs, and malformed values before they reach Mongoose.
 */
export function requireObjectId(value: unknown, label = 'Record ID'): string {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw new CmsError(`${label} must be a valid MongoDB ObjectId.`, 400);
  }
  return value;
}

export function stripPersistenceFields<T extends Record<string, unknown>>(value: T): Omit<T, '_id' | 'id' | '__v' | 'createdAt' | 'updatedAt'> {
  const { _id, id, __v, createdAt, updatedAt, ...rest } = value;
  return rest;
}

export function serialize<T extends { _id?: unknown }>(value: T): T & { _id?: string } {
  return { ...value, _id: value._id == null ? undefined : String(value._id) };
}
