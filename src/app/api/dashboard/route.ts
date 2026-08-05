import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectToDatabase();

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
      dbRecentContacts,
      dbPendingBookings,
      dbTotalBookings,
      dbUnreadMessages,
      dbTotalContacts,
    ] = await Promise.all([
      GalleryImage.countDocuments().catch(() => 0),
      GalleryImage.countDocuments({ featured: true }).catch(() => 0),
      Film.countDocuments().catch(() => 0),
      Service.countDocuments().catch(() => 0),
      Testimonial.countDocuments().catch(() => 0),
      VideoTestimonial.countDocuments().catch(() => 0),
      Review.countDocuments().catch(() => 0),
      FAQ.countDocuments().catch(() => 0),
      Contact.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }).catch(() => 0),
      Booking.countDocuments({ status: 'pending' }).catch(() => 0),
      Booking.countDocuments().catch(() => 0),
      Contact.countDocuments({ read: false }).catch(() => 0),
      Contact.countDocuments().catch(() => 0),
    ]);

    const totalImages = dbImages > 0 ? dbImages : 20;
    const homepageGalleryCount = dbFeaturedImages > 0 ? dbFeaturedImages : 5;
    const totalFilms = dbFilms > 0 ? dbFilms : 3;
    const totalServices = dbServices > 0 ? dbServices : 6;
    const totalTestimonials = dbTestimonials > 0 ? dbTestimonials : 5;
    const totalVideoTestimonials = dbVideoTestimonials > 0 ? dbVideoTestimonials : 3;
    const totalReviews = dbReviews > 0 ? dbReviews : 4;
    const totalFAQs = dbFAQs > 0 ? dbFAQs : 8;

    return NextResponse.json({
      totalImages,
      homepageGalleryCount,
      totalFilms,
      totalServices,
      totalTestimonials,
      totalVideoTestimonials,
      totalReviews,
      totalFAQs,
      recentContacts: dbRecentContacts,
      pendingBookings: dbPendingBookings,
      totalBookings: dbTotalBookings,
      unreadMessages: dbUnreadMessages,
      totalContacts: dbTotalContacts,
    });
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
