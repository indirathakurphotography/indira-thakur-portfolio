import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import Film from '@/models/Film';
import { formatVideoEmbedUrl } from '@/lib/videoUrlHelper';

export interface FilmItemData {
  _id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  publicId?: string;
  category?: string;
  duration?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FILMS: FilmItemData[] = [];

const FALLBACK_FILE_PATH = path.join('/tmp', 'films_fallback_store.json');
let memoryStore: FilmItemData[] | null = null;

function loadFallbackStore(): FilmItemData[] {
  if (memoryStore !== null) return memoryStore;
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const content = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[filmsStorage] Error reading fallback store:', err);
  }
  memoryStore = [...DEFAULT_FILMS];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: FilmItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[filmsStorage] Error writing fallback store:', err);
  }
}

export async function fetchAllFilms(): Promise<FilmItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoFilms = await (Film as any).find({}).sort({ order: 1, createdAt: -1 }).lean();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (mongoFilms || []).map((f: any) => ({
        _id: String(f._id),
        title: String(f.title || ''),
        description: String(f.description || ''),
        videoUrl: String(f.videoUrl || ''),
        thumbnailUrl: String(f.thumbnailUrl || ''),
        publicId: String(f.publicId || ''),
        category: String(f.category || 'Wedding Film'),
        duration: String(f.duration || ''),
        featured: Boolean(f.featured),
        order: typeof f.order === 'number' ? f.order : 0,
      }));
      saveFallbackStore(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[filmsStorage] MongoDB fetch failed, using fallback store:', err);
  }

  return loadFallbackStore();
}

export async function createNewFilm(data: Partial<FilmItemData>): Promise<FilmItemData> {
  const newFilmData = {
    title: data.title || 'New Film',
    description: data.description || '',
    videoUrl: data.videoUrl || '',
    thumbnailUrl: data.thumbnailUrl || '',
    publicId: data.publicId || '',
    category: data.category || 'Wedding Film',
    duration: data.duration || '',
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : Date.now(),
  };

  const list = loadFallbackStore();
  const fallbackFilm: FilmItemData = {
    _id: `film_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...newFilmData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(fallbackFilm);
  saveFallbackStore(list);

  try {
    const db = await connectToDatabase();
    if (db) {
      const created = await (Film as any).create(newFilmData);
      if (created) {
        fallbackFilm._id = String(created._id);
        saveFallbackStore(list);
      }
    }
  } catch (err) {
    console.warn('[filmsStorage] MongoDB create failed, saved to fallback:', err);
  }

  return fallbackFilm;
}

export async function updateExistingFilm(id: string, data: Partial<FilmItemData>): Promise<FilmItemData | null> {
  const list = loadFallbackStore();
  const idx = list.findIndex(f => f._id === id);
  let updatedItem: FilmItemData | null = null;

  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...(typeof data.title !== 'undefined' && { title: data.title }),
      ...(typeof data.description !== 'undefined' && { description: data.description }),
      ...(typeof data.videoUrl !== 'undefined' && { videoUrl: data.videoUrl }),
      ...(typeof data.thumbnailUrl !== 'undefined' && { thumbnailUrl: data.thumbnailUrl }),
      ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
      ...(typeof data.category !== 'undefined' && { category: data.category }),
      ...(typeof data.duration !== 'undefined' && { duration: data.duration }),
      ...(typeof data.featured === 'boolean' && { featured: data.featured }),
      ...(typeof data.order === 'number' && { order: data.order }),
      updatedAt: new Date().toISOString(),
    };
    updatedItem = list[idx];
    saveFallbackStore(list);
  }

  try {
    const db = await connectToDatabase();
    if (db) {
      const dbUpdate = {
        ...(typeof data.title !== 'undefined' && { title: data.title }),
        ...(typeof data.description !== 'undefined' && { description: data.description }),
        ...(typeof data.videoUrl !== 'undefined' && { videoUrl: data.videoUrl }),
        ...(typeof data.thumbnailUrl !== 'undefined' && { thumbnailUrl: data.thumbnailUrl }),
        ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
        ...(typeof data.category !== 'undefined' && { category: data.category }),
        ...(typeof data.duration !== 'undefined' && { duration: data.duration }),
        ...(typeof data.featured === 'boolean' && { featured: data.featured }),
        ...(typeof data.order === 'number' && { order: data.order }),
      };
      const updated = await (Film as any).findByIdAndUpdate(id, dbUpdate, { new: true });
      if (updated) {
        return {
          _id: String(updated._id),
          title: updated.title,
          description: updated.description,
          videoUrl: updated.videoUrl,
          thumbnailUrl: updated.thumbnailUrl,
          publicId: updated.publicId,
          category: updated.category,
          duration: updated.duration,
          featured: updated.featured,
          order: updated.order,
        };
      }
    }
  } catch (err) {
    console.warn('[filmsStorage] MongoDB update failed, updated in fallback:', err);
  }

  return updatedItem;
}

export async function deleteExistingFilm(id: string): Promise<boolean> {
  const list = loadFallbackStore();
  const filtered = list.filter(f => f._id !== id);
  saveFallbackStore(filtered);

  try {
    const db = await connectToDatabase();
    if (db) {
      await (Film as any).findByIdAndDelete(id);
    }
  } catch (err) {
    console.warn('[filmsStorage] MongoDB delete failed, deleted from fallback:', err);
  }

  return true;
}
