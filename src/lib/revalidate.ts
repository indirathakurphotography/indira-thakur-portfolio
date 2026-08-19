import { revalidatePath, revalidateTag } from 'next/cache';
import { invalidateServerDataCache } from '@/components/layout/ServerDataProvider';
import { invalidateGalleryCache } from '@/lib/galleryCache';
import { clearServerGalleryCache } from '@/lib/getGalleryImagesServer';

export function triggerRevalidation() {
  try {
    invalidateServerDataCache();
    invalidateGalleryCache();
    clearServerGalleryCache();
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/about');
    revalidatePath('/services');
    revalidatePath('/services/[slug]', 'page');
    revalidatePath('/services', 'layout');
    revalidatePath('/films');
    revalidatePath('/testimonials');
    revalidatePath('/contact');
    revalidatePath('/faq');
    revalidatePath('/gallery');
    revalidatePath('/admin');

    try {
      // Safely call revalidateTag with type compatibility
      const safeRevalidateTag = revalidateTag as (tag: string, ...args: unknown[]) => void;
      safeRevalidateTag('site-config');
      safeRevalidateTag('theme');
      safeRevalidateTag('brand');
      safeRevalidateTag('gallery');
      safeRevalidateTag('services');
      safeRevalidateTag('about');
      safeRevalidateTag('films');
      safeRevalidateTag('testimonials');
      safeRevalidateTag('faqs');
      safeRevalidateTag('seo');
    } catch {}
  } catch (e) {
    console.warn('Revalidation trigger warning:', e);
  }
}
