import { connectToDatabase } from '@/lib/mongodb';
import Film from '@/models/Film';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

const FilmModel = Film as any;

export interface FilmItemData {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  googleDriveLink?: string;
  thumbnailUrl?: string;
  publicId?: string;
  category?: string;
  duration?: string;
  featured?: boolean;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}


function mapFilm(doc: any): FilmItemData {
  return {
    _id: String(doc._id),
    title: String(doc.title || ''),
    description: String(doc.description || ''),
    videoUrl: String(doc.videoUrl || ''),
    googleDriveLink: String(doc.googleDriveLink || ''),
    thumbnailUrl: String(doc.thumbnailUrl || ''),
    publicId: String(doc.publicId || ''),
    category: String(doc.category || 'Wedding Film'),
    duration: String(doc.duration || ''),
    featured: Boolean(doc.featured),
    order: typeof doc.order === 'number' ? doc.order : 0,
  };
}

export async function fetchAllFilms(): Promise<FilmItemData[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read films.');
  }
  const mongoFilms = await FilmModel.find({}).sort({ order: 1, createdAt: -1 }).lean();
  return (mongoFilms || []).map(mapFilm);
}

export async function createNewFilm(data: Partial<FilmItemData>): Promise<FilmItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist film.');
  }

  const newFilmData = {
    title: data.title || 'New Film',
    description: data.description || '',
    videoUrl: data.videoUrl || '',
    googleDriveLink: data.googleDriveLink || '',
    thumbnailUrl: data.thumbnailUrl || '',
    publicId: data.publicId || '',
    category: data.category || 'Wedding Film',
    duration: data.duration || '',
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : Date.now(),
  };

  const created: any = await Film.create(newFilmData);

  // Read-after-write verification
  const fresh: any = await FilmModel.findById(created._id).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created film was not found in MongoDB.');
  }

  return mapFilm(fresh);
}

export async function updateExistingFilm(id: string, data: Partial<FilmItemData>): Promise<FilmItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update film.');
  }

  const objectId = parseObjectId(id);
  const dbUpdate: any = {
    ...(typeof data.title !== 'undefined' && { title: data.title }),
    ...(typeof data.description !== 'undefined' && { description: data.description }),
    ...(typeof data.videoUrl !== 'undefined' && { videoUrl: data.videoUrl }),
    ...(typeof data.googleDriveLink !== 'undefined' && { googleDriveLink: data.googleDriveLink }),
    ...(typeof data.thumbnailUrl !== 'undefined' && { thumbnailUrl: data.thumbnailUrl }),
    ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
    ...(typeof data.category !== 'undefined' && { category: data.category }),
    ...(typeof data.duration !== 'undefined' && { duration: data.duration }),
    ...(typeof data.featured === 'boolean' && { featured: data.featured }),
    ...(typeof data.order === 'number' && { order: data.order }),
  };

  const updated: any = await FilmModel.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
  if (!updated) {
    throw new ApiError('Film not found', 404);
  }

  // Read-after-write verification
  const fresh: any = await FilmModel.findById(objectId).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated film was not found in MongoDB.');
  }

  return mapFilm(fresh);
}

export async function deleteExistingFilm(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to delete film.');
  }

  const objectId = parseObjectId(id);
  const deleted = await Film.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) {
    throw new ApiError('Film not found', 404);
  }

  // Delete verification
  const check = await FilmModel.findById(objectId).lean();
  if (check) {
    throw new Error('Delete verification failed: film still exists in MongoDB.');
  }

  return true;
}
