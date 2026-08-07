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

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const noCache = url.searchParams.get('nocache') === 'true';

    const now = Date.now();
    if (!noCache && dashboardCache && (now - dashboardCache.timestamp < CACHE_TTL_MS)) {
      return NextResponse.json({ ...dashboardCache.data, cached: true });
    }

    const conn = await connectToDatabase();
    if (!conn) {
      // Fallback if DB is unavailable
      return NextResponse.json({
        totalImages: 0,
        homepageGalleryCount: 4,
        totalFilms: 1,
        totalServices: 6,
        totalTestimonials: 5,
        totalVideoTestimonials: 1,
        totalReviews: 0,
        totalFAQs: 10,
        recentContacts: 0,
        pendingBookings: 0,
        totalBookings: 0,
        unreadMessages: 0,
        totalContacts: 0,
        recentBookings: [],
        recentContactsList: [],
        lastUpdated: new Date().toISOString(),
      });
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
      recentBookings,
      recentContactsList,
    ] = await Promise.all([
      GalleryImage.estimatedDocumentCount().catch(() => GalleryImage.countDocuments().catch(() => 0)),
      GalleryImage.countDocuments({ featured: true }).catch(() => 0),
      Film.estimatedDocumentCount().catch(() => Film.countDocuments().catch(() => 0)),
      Service.estimatedDocumentCount().catch(() => Service.countDocuments().catch(() => 0)),
      Testimonial.estimatedDocumentCount().catch(() => Testimonial.countDocuments().catch(() => 0)),
      VideoTestimonial.estimatedDocumentCount().catch(() => VideoTestimonial.countDocuments().catch(() => 0)),
      Review.estimatedDocumentCount().catch(() => Review.countDocuments().catch(() => 0)),
      FAQ.estimatedDocumentCount().catch(() => FAQ.countDocuments().catch(() => 0)),
      Booking.estimatedDocumentCount().catch(() => Booking.countDocuments().catch(() => 0)),
      Booking.countDocuments({ status: 'pending' }).catch(() => 0),
      Contact.estimatedDocumentCount().catch(() => Contact.countDocuments().catch(() => 0)),
      Contact.countDocuments({ read: false }).catch(() => 0),
      Booking.find().sort({ createdAt: -1 }).limit(3).select('name email serviceType date status createdAt').lean().catch(() => []),
      Contact.find().sort({ createdAt: -1 }).limit(3).select('name email subject message read createdAt').lean().catch(() => []),
    ]);

    const result = {
      totalImages: dbImages,
      homepageGalleryCount: dbFeaturedImages > 0 ? dbFeaturedImages : 4,
      totalFilms: dbFilms > 0 ? dbFilms : 1,
      totalServices: dbServices > 0 ? dbServices : 6,
      totalTestimonials: dbTestimonials > 0 ? dbTestimonials : 5,
      totalVideoTestimonials: dbVideoTestimonials > 0 ? dbVideoTestimonials : 1,
      totalReviews: dbReviews,
      totalFAQs: dbFAQs > 0 ? dbFAQs : 10,
      recentContacts: dbUnreadMessages,
      pendingBookings: dbPendingBookings,
      totalBookings: dbTotalBookings,
      unreadMessages: dbUnreadMessages,
      totalContacts: dbTotalContacts,
      recentBookings: recentBookings || [],
      recentContactsList: recentContactsList || [],
      lastUpdated: new Date().toISOString(),
    };

    dashboardCache = {
      data: result,
      timestamp: Date.now(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dashboard GET error:', error);
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
