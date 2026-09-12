export interface GalleryIdentityRecord {
  _id?: unknown; id?: unknown; src?: string; thumbnail?: string; publicId?: string;
  category?: string; title?: string; alt?: string; description?: string; caption?: string;
  width?: number; height?: number; order?: number; createdAt?: string | Date; updatedAt?: string | Date;
}

export function normalizeGallerySource(value?: string | null): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed.toLowerCase();
  try {
    const url = new URL(trimmed, 'https://gallery.local');
    const pathname = url.pathname.replace(/\/+$/, '').toLowerCase();
    return pathname.replace(/^\/api\/media\//, '');
  } catch {
    return trimmed.split(/[?#]/, 1)[0].replace(/^\/+/, '').toLowerCase();
  }
}

export function getGallerySourceKey(record: GalleryIdentityRecord): string {
  return normalizeGallerySource(record.publicId || record.src || record.thumbnail);
}

export function getStableGalleryRecordId(record: GalleryIdentityRecord): string {
  const id = record._id ?? record.id;
  if (id !== undefined && id !== null && String(id).trim()) return String(id);
  const source = getGallerySourceKey(record);
  return source ? `source-${source.replace(/[^a-z0-9]+/gi, '-')}` : '';
}

function completenessScore(record: GalleryIdentityRecord): number {
  let score = 0;
  if (record.category && String(record.category).trim()) score += 100;
  if (record.publicId && String(record.publicId).trim()) score += 20;
  if (record.title && String(record.title).trim()) score += 10;
  if (record.alt && String(record.alt).trim()) score += 8;
  if (record.description && String(record.description).trim()) score += 6;
  if (record.caption && String(record.caption).trim()) score += 4;
  if (typeof record.order === 'number' && record.order > 0) score += 2;
  return score;
}

export function chooseCanonicalGalleryRecord<T extends GalleryIdentityRecord>(a: T, b: T): T {
  const aScore = completenessScore(a), bScore = completenessScore(b);
  if (aScore !== bScore) return bScore > aScore ? b : a;
  const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
  const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
  return bUpdated > aUpdated ? b : a;
}

export function dedupeGalleryRecords<T extends GalleryIdentityRecord>(records: T[]): T[] {
  const result: T[] = [];
  const indexes = new Map<string, number>();
  for (const record of records || []) {
    if (!record) continue;
    const key = normalizeGallerySource(record.src || record.thumbnail || record.publicId);
    if (!key) { result.push(record); continue; }
    const existingIndex = indexes.get(key);
    if (existingIndex === undefined) { indexes.set(key, result.length); result.push(record); }
    else result[existingIndex] = chooseCanonicalGalleryRecord(result[existingIndex], record);
  }
  return result;
}
