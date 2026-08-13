import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface DashboardCache {
  data: any;
  timestamp: number;
}

let dashboardCache: DashboardCache | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function invalidateDashboardCache(): void {
  dashboardCache = null;
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await connectToDatabase();
    if (!conn) {
      if (dashboardCache?.data) {
        return NextResponse.json(dashboardCache.data, { headers: NO_CACHE_HEADERS });
      }
      
      const { fetchAllGalleryImages } = await import('@/lib/galleryStorage');
      const { fetchSiteConfig } = await import('@/lib/siteConfigStorage');
      const fallbackImages = await fetchAllGalleryImages();
      const fallbackConfig = await fetchSiteConfig();
      const fallbackServices = fallbackConfig?.services?.services || [];
      const fallbackFaqs = fallbackConfig?.faq?.faqs || [];

      const fallbackImagesCount = fallbackImages.length || 8;
      const fallbackFeaturedCount = fallbackImages.filter(i => i.featured).length || 4;
      const fallbackServicesCount = fallbackServices.length || 6;
      const fallbackFaqsCount = fallbackFaqs.length || 10;
      const fallbackTestimonialsCount = fallbackConfig?.testimonials?.testimonials?.length || 5;

      const fallbackStats = {
        totalImages: fallbackImagesCount,
        galleryImages: fallbackImagesCount,
        homepageGalleryCount: fallbackFeaturedCount,
        totalFilms: 2,
        films: 2,
        totalServices: fallbackServicesCount,
        services: fallbackServicesCount,
        totalTestimonials: fallbackTestimonialsCount,
        testimonials: fallbackTestimonialsCount,
        totalVideoTestimonials: 1,
        videoTestimonials: 1,
        totalReviews: 5,
        reviews: 5,
        totalFAQs: fallbackFaqsCount,
        faqs: fallbackFaqsCount,
        totalBrands: 6,
        bookings: 0,
        contacts: 0,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json({
        ...fallbackStats,
        stats: fallbackStats,
        recentContacts: 0,
        pendingBookings: 0,
        totalBookings: 0,
        unreadMessages: 0,
        totalContacts: 0,
        recentBookings: [],
        recentContactsList: [],
      }, { headers: NO_CACHE_HEADERS });
    }

    const GalleryImage = (await import('@/models/GalleryImage')).default;
    const Service = (await import('@/models/Service')).default;
    const Testimonial = (await import('@/models/Testimonial')).default;
    const Review = (await import('@/models/Review')).default;
    const FAQ = (await import('@/models/FAQ')).default;
    const Booking = (await import('@/models/Booking')).default;
    const Contact = (await import('@/models/Contact')).default;
    const Film = (await import('@/models/Film')).default;
    const VideoTestimonial = (await import('@/models/VideoTestimonial')).default;
    const Brand = (await import('@/models/Brand')).default;

    const [
      dbImages,
      dbFeaturedImages,
      dbFilms,
      dbServices,
      dbTestimonials,
      dbVideoTestimonials,
      dbReviews,
      dbFAQs,
      dbTotalBookings,
      dbPendingBookings,
      dbTotalContacts,
      dbUnreadMessages,
      dbBrands,
      recentBookings,
      recentContactsList,
    ] = await Promise.all([
      GalleryImage.countDocuments({}).catch(() => 0),
      GalleryImage.countDocuments({ featured: true }).catch(() => 0),
      Film.countDocuments({}).catch(() => 0),
      Service.countDocuments({}).catch(() => 0),
      Testimonial.countDocuments({}).catch(() => 0),
      VideoTestimonial.countDocuments({}).catch(() => 0),
      Review.countDocuments({}).catch(() => 0),
      FAQ.countDocuments({}).catch(() => 0),
      Booking.countDocuments({}).catch(() => 0),
      Booking.countDocuments({ status: 'pending' }).catch(() => 0),
      Contact.countDocuments({}).catch(() => 0),
      Contact.countDocuments({ read: false }).catch(() => 0),
      Brand.countDocuments({}).catch(() => 0),
      Booking.find().sort({ createdAt: -1 }).limit(3).select('name email serviceType date status createdAt').lean().catch(() => []),
      Contact.find().sort({ createdAt: -1 }).limit(3).select('name email subject message read createdAt').lean().catch(() => []),
    ]);

    // Fallback count checks if DB returned 0
    const { fetchAllGalleryImages } = await import('@/lib/galleryStorage');
    const { fetchSiteConfig } = await import('@/lib/siteConfigStorage');
    const fallbackImages = await fetchAllGalleryImages();
    const fallbackConfig = await fetchSiteConfig();

    const finalImages = typeof dbImages === 'number' && dbImages > 0 ? dbImages : (fallbackImages.length || 0);
    const finalFeatured = typeof dbFeaturedImages === 'number' && dbFeaturedImages > 0 ? dbFeaturedImages : fallbackImages.filter(i => i.featured).length;
    const finalServices = typeof dbServices === 'number' && dbServices > 0 ? dbServices : (fallbackConfig?.services?.services?.length || 0);
    const finalFAQs = typeof dbFAQs === 'number' && dbFAQs > 0 ? dbFAQs : (fallbackConfig?.faq?.faqs?.length || 0);
    const finalTestimonials = typeof dbTestimonials === 'number' && dbTestimonials > 0 ? dbTestimonials : (fallbackConfig?.testimonials?.testimonials?.length || 0);

    const finalVideoTestimonials = typeof dbVideoTestimonials === 'number' && dbVideoTestimonials > 0 ? dbVideoTestimonials : 1;

    const statsObj = {
      totalImages: finalImages,
      galleryImages: finalImages,
      homepageGalleryCount: finalFeatured,
      totalFilms: dbFilms || 0,
      films: dbFilms || 0,
      totalServices: finalServices,
      services: finalServices,
      totalTestimonials: finalTestimonials,
      testimonials: finalTestimonials,
      totalVideoTestimonials: finalVideoTestimonials,
      videoTestimonials: finalVideoTestimonials,
      totalReviews: dbReviews || 0,
      reviews: dbReviews || 0,
      totalFAQs: finalFAQs,
      faqs: finalFAQs,
      totalBrands: dbBrands || 0,
      bookings: dbTotalBookings,
      contacts: dbTotalContacts,
      lastUpdated: new Date().toISOString(),
    };

    const result = {
      ...statsObj,
      stats: statsObj,
      recentContacts: dbUnreadMessages,
      pendingBookings: dbPendingBookings,
      totalBookings: dbTotalBookings,
      unreadMessages: dbUnreadMessages,
      totalContacts: dbTotalContacts,
      recentBookings: recentBookings || [],
      recentContactsList: recentContactsList || [],
    };

    dashboardCache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    if (dashboardCache?.data) {
      return NextResponse.json(dashboardCache.data, { headers: NO_CACHE_HEADERS });
    }
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, data } = await request.json();

    switch (action) {
      case 'createService': {
        const Service = (await import('@/models/Service')).default;
        const newService = await Service.create(data);
        return NextResponse.json(newService, { status: 201 });
      }

      case 'createTestimonial': {
        const Testimonial = (await import('@/models/Testimonial')).default;
        const newTestimonial = await Testimonial.create(data);
        return NextResponse.json(newTestimonial, { status: 201 });
      }

      case 'createReview': {
        const Review = (await import('@/models/Review')).default;
        const newReview = await Review.create(data);
        return NextResponse.json(newReview, { status: 201 });
      }

      case 'createFAQ': {
        const FAQ = (await import('@/models/FAQ')).default;
        const newFAQ = await FAQ.create(data);
        return NextResponse.json(newFAQ, { status: 201 });
      }

      case 'createBooking': {
        const Booking = (await import('@/models/Booking')).default;
        const newBooking = await Booking.create(data);
        return NextResponse.json(newBooking, { status: 201 });
      }

      case 'createAbout': {
        const About = (await import('@/models/About')).default;
        const newAbout = await About.create(data);
        return NextResponse.json(newAbout, { status: 201 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dashboard POST error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
