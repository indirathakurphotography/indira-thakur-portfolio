import { revalidatePath, revalidateTag } from 'next/cache';

export function triggerRevalidation() {
  try {
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
