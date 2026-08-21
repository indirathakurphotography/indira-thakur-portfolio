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

export const DEFAULT_INSTAGRAM_LINKS: InstagramLinkData[] = [
  {
    _id: 'default-ig-1',
    title: 'Fine Art Newborn Storytelling',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    isActive: true,
    order: 1,
  },
  {
    _id: 'default-ig-2',
    title: 'Maternity Editorial Elegance',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
    isActive: true,
    order: 2,
  },
  {
    _id: 'default-ig-3',
    title: 'Wedding & Heirloom Portraits',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    isActive: true,
    order: 3,
  },
  {
    _id: 'default-ig-4',
    title: 'Naming Ceremony & Celebrations',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    isActive: true,
    order: 4,
  },
  {
    _id: 'default-ig-5',
    title: 'Infant Art & Tender Moments',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523941414-newborn_family_shoot.jpg',
    isActive: true,
    order: 5,
  },
  {
    _id: 'default-ig-6',
    title: 'Luxury Maternity Portraiture',
    category: 'home',
    mediaType: 'instagram',
    url: 'https://www.instagram.com/indirathakurphotography/',
    thumbnailUrl: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    isActive: true,
    order: 6,
  },
];

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

export async function listInstagramLinks(category?: string, adminMode = false) {
  try {
    await connectToDatabase();
    const query = adminMode ? {} : { isActive: true };
    const docs = await InstagramLink.find(query).sort({ order: 1, createdAt: -1 }).lean();
    const items = docs && docs.length > 0 ? docs.map(map) : DEFAULT_INSTAGRAM_LINKS;

    if (!category || category === 'all') return items;
    const requestedCategory = normalizeCategory(category);
    
    const filtered = items.filter((item) => {
      if (requestedCategory === 'home' || requestedCategory === 'homepage') {
        return item.category === 'home' || item.category === 'homepage' || !item.category;
      }
      return isCategoryMatch(item.category, requestedCategory);
    });

    if (adminMode) return filtered;
    return filtered.length > 0 ? filtered : (requestedCategory === 'home' ? DEFAULT_INSTAGRAM_LINKS : []);
  } catch (err) {
    console.warn('Using fallback Instagram links due to DB status:', err);
    if (!category || category === 'all') return DEFAULT_INSTAGRAM_LINKS;
    const requestedCategory = normalizeCategory(category);
    const filtered = DEFAULT_INSTAGRAM_LINKS.filter((item) => {
      if (requestedCategory === 'home' || requestedCategory === 'homepage') {
        return item.category === 'home' || item.category === 'homepage' || !item.category;
      }
      return isCategoryMatch(item.category, requestedCategory);
    });
    return filtered.length > 0 ? filtered : (requestedCategory === 'home' ? DEFAULT_INSTAGRAM_LINKS : []);
  }
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
