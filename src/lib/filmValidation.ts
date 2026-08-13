export interface FilmValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Server and client-side payload validation for Film CMS.
 * Prevents cross-category asset pollution (e.g. using Video Testimonial MP4s
 * or Home Hero Slideshow images inside Films).
 */
export function validateFilmPayload(data: {
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}): FilmValidationResult {
  if (!data.title || !data.title.trim()) {
    return { valid: false, error: 'Title is required.' };
  }

  if (!data.videoUrl || !data.videoUrl.trim()) {
    return { valid: false, error: 'Video URL is required.' };
  }

  const videoUrl = data.videoUrl.trim();

  // 1. Reject forbidden cross-category media paths for video
  if (videoUrl.includes('/videos/testimonials/') || videoUrl.includes('/testimonials/')) {
    return {
      valid: false,
      error: 'This asset belongs to Video Testimonials and cannot be used for a Film.',
    };
  }

  if (videoUrl.includes('/home/hero/') || videoUrl.includes('/slideshow/')) {
    return {
      valid: false,
      error: 'This asset belongs to Home Hero Slideshow and cannot be used for a Film.',
    };
  }

  if (videoUrl.includes('/services/')) {
    return {
      valid: false,
      error: 'This asset belongs to Services and cannot be used for a Film.',
    };
  }

  // 2. Validate supported video URL pattern
  const isYouTube = /youtu(\.be|be\.com)/i.test(videoUrl);
  const isDrive = /drive\.google\.com/i.test(videoUrl);
  const isVimeo = /vimeo\.com/i.test(videoUrl);
  const isDirectVideo =
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(videoUrl) ||
    videoUrl.includes('/storage/v1/object/public/');

  if (!isYouTube && !isDrive && !isVimeo && !isDirectVideo) {
    return {
      valid: false,
      error: 'Invalid or unsupported video URL. Must be YouTube, Google Drive, Vimeo, or a direct video file URL.',
    };
  }

  // 3. Reject forbidden cross-category media paths for thumbnail
  if (data.thumbnailUrl && data.thumbnailUrl.trim()) {
    const thumbUrl = data.thumbnailUrl.trim();

    if (thumbUrl.includes('/videos/testimonials/') || thumbUrl.includes('/testimonials/')) {
      return {
        valid: false,
        error: 'This thumbnail belongs to Video Testimonials and cannot be used for a Film.',
      };
    }

    if (thumbUrl.includes('/home/hero/') || thumbUrl.includes('/slideshow/')) {
      return {
        valid: false,
        error: 'This thumbnail belongs to Home Hero Slideshow and cannot be used for a Film.',
      };
    }

    if (thumbUrl.includes('/services/')) {
      return {
        valid: false,
        error: 'This thumbnail belongs to Services and cannot be used for a Film.',
      };
    }
  }

  return { valid: true };
}
