import { connectToDatabase } from '@/lib/mongodb';
import InstagramLink from '@/models/InstagramLink';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { isCategoryMatch, normalizeCategory } from '@/lib/categoryUtils';

export type InstagramLinkData = {
  _id: string;
  title: string;
  category: string;
  mediaType: 'instagram' | 'video';
  url: string;
  thumbnailUrl?: string;
  isActive: boolean;
  order: number;
};

const map = (item: any): InstagramLinkData => ({
  _id: String(item._id),
  title: String(item.title || ''),
  category: String(item.category || 'home'),
  mediaType: item.mediaType === 'video' ? 'video' : 'instagram',
  url: String(item.url || ''),
  thumbnailUrl: String(item.thumbnailUrl || ''),
  isActive: item.isActive !== false,
  order: typeof item.order === 'number' ? item.order : 0,
});

export async function listInstagramLinks(category?: string) {
  await connectToDatabase();
  const items = (await InstagramLink.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean()).map(map);
  if (!category) return items;

  const requestedCategory = normalizeCategory(category);
  return items.filter((item) => isCategoryMatch(item.category, requestedCategory));
}

export async function createInstagramLink(data: Partial<InstagramLinkData>) {
  await connectToDatabase();
  const saved = await InstagramLink.create({ ...data, order: typeof data.order === 'number' ? data.order : Date.now() });
  return map(saved);
}

export async function updateInstagramLink(id: string, data: Partial<InstagramLinkData>) {
  await connectToDatabase();
  const saved = await InstagramLink.findByIdAndUpdate(parseObjectId(id), data, { new: true }).lean();
  if (!saved) throw new ApiError('Instagram item not found', 404);
  return map(saved);
}

export async function deleteInstagramLink(id: string) {
  await connectToDatabase();
  const removed = await InstagramLink.findByIdAndDelete(parseObjectId(id));
  if (!removed) throw new ApiError('Instagram item not found', 404);
}
