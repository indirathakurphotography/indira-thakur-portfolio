import {
  MAX_IMAGE_UPLOAD_SIZE,
  MAX_VIDEO_UPLOAD_SIZE,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  MAX_VIDEO_UPLOAD_SIZE_MB,
  IMAGE_ALLOWED_TYPES,
  VIDEO_ALLOWED_TYPES,
  IMAGE_ACCEPT_STRING,
  VIDEO_ACCEPT_STRING,
  IMAGE_UPLOAD_ERROR,
  VIDEO_UPLOAD_ERROR,
} from '@/lib/uploadConstants';

export type ImageType = 'hero' | 'logo' | 'favicon' | 'gallery' | 'general' | 'about' | 'services' | 'testimonials' | 'contact';

export interface ImageSpec {
  label: string;
  aspectRatio: string;
  recommendedResolution: string;
  accept: string;
  maxSizeMB: number;
}

export const IMAGE_SPECS: Record<string, ImageSpec> = {
  hero: {
    label: 'Hero Banner',
    aspectRatio: '16:9',
    recommendedResolution: '1920 × 1080 px (or higher)',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  about: {
    label: 'About Section',
    aspectRatio: '4:5',
    recommendedResolution: '1200 × 1500 px',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  services: {
    label: 'Services',
    aspectRatio: '4:5',
    recommendedResolution: '1200 × 1500 px',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  gallery: {
    label: 'Gallery',
    aspectRatio: 'Flexible (4:5 portrait, 1:1 square, 3:2 landscape)',
    recommendedResolution: '1200 × 1500 px (portrait) / 1200 × 1200 px (square) / 1500 × 1000 px (landscape)',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  testimonials: {
    label: 'Testimonials',
    aspectRatio: '1:1',
    recommendedResolution: '1000 × 1000 px',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  contact: {
    label: 'Contact Section',
    aspectRatio: '4:5',
    recommendedResolution: '1200 × 1500 px',
    accept: IMAGE_ACCEPT_STRING,
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  logo: {
    label: 'Logo',
    aspectRatio: 'Flexible',
    recommendedResolution: 'Transparent PNG or SVG recommended',
    accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
  favicon: {
    label: 'Favicon',
    aspectRatio: '1:1',
    recommendedResolution: 'Square image recommended',
    accept: 'image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon',
    maxSizeMB: MAX_IMAGE_UPLOAD_SIZE_MB,
  },
};

export const VIDEO_SPEC = {
  label: 'Film / Video',
  acceptedFormats: 'MP4 (H.264)',
  recommendedResolution: '1920 × 1080 (1080p)',
  aspectRatio: '16:9',
  frameRate: '24fps or 30fps',
  audio: 'AAC',
  recommendedDuration: '30 seconds – 3 minutes',
  maxDuration: '5 minutes',
  recommendedFileSize: '20 MB – 80 MB',
  maxFileSize: `${MAX_VIDEO_UPLOAD_SIZE_MB} MB`,
  absoluteUploadLimit: `${MAX_VIDEO_UPLOAD_SIZE_MB} MB`,
  accept: VIDEO_ACCEPT_STRING,
  maxSizeMB: MAX_VIDEO_UPLOAD_SIZE_MB,
};

export function getImageAspectRatio(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      URL.revokeObjectURL(url);
      resolve(ratio);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function validateImageFile(file: File): { valid: boolean; error: string | null } {
  if (!IMAGE_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type || 'unknown'}. Allowed: JPG, PNG, WebP.` };
  }
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    return { valid: false, error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum image upload size is ${MAX_IMAGE_UPLOAD_SIZE_MB} MB.` };
  }
  return { valid: true, error: null };
}

export function validateVideoFile(file: File): { valid: boolean; error: string | null } {
  if (!VIDEO_ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: `Unsupported file type: ${file.type || 'unknown'}. Only MP4 (H.264) is allowed.` };
  }
  if (file.size > MAX_VIDEO_UPLOAD_SIZE) {
    return { valid: false, error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum video upload size is ${MAX_VIDEO_UPLOAD_SIZE_MB} MB.` };
  }
  return { valid: true, error: null };
}

export function getImageTypeAccept(type: ImageType): string {
  return IMAGE_SPECS[type]?.accept || IMAGE_SPECS.general.accept;
}

export function validateHeroImage(aspectRatio: number): { valid: boolean; warning: string | null } {
  if (aspectRatio < 0.75 || aspectRatio > 1.5) {
    return { valid: true, warning: null };
  }
  return {
    valid: true,
    warning: 'This image appears to be a logo or square image. Hero backgrounds work best with landscape photographs.',
  };
}
