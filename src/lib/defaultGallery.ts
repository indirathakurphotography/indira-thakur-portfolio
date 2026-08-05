export interface RawGalleryItem {
  _id: string;
  src: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  alt?: string;
  order?: number;
}

export const DEFAULT_SHOOT_GALLERY: RawGalleryItem[] = [];
