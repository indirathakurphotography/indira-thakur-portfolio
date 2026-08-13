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
    revalidatePath('/films');
    revalidatePath('/testimonials');
    revalidatePath('/contact');
    revalidatePath('/faq');
    revalidatePath('/gallery');
    revalidatePath('/admin');

    revalidateTag('site-config', 'default');
    revalidateTag('theme', 'default');
    revalidateTag('brand', 'default');
    revalidateTag('gallery', 'default');
    revalidateTag('services', 'default');
    revalidateTag('about', 'default');
    revalidateTag('films', 'default');
    revalidateTag('testimonials', 'default');
    revalidateTag('faqs', 'default');
    revalidateTag('seo', 'default');
  } catch (e) {
    console.warn('Revalidation trigger warning:', e);
  }
}
