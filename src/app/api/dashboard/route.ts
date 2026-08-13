import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cmsDatabase';
import { serializeDoc } from '@/lib/cmsDatabase';
import GalleryImage from '@/models/GalleryImage';
import Service from '@/models/Service';
import Testimonial from '@/models/Testimonial';
import Review from '@/models/Review';
import FAQ from '@/models/FAQ';
import Booking from '@/models/Booking';
import Contact from '@/models/Contact';
import Film from '@/models/Film';
import VideoTestimonial from '@/models/VideoTestimonial';
import Brand from '@/models/Brand';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const [
      totalImages,
      homepageGalleryCount,
      totalFilms,
      totalServices,
      totalTestimonials,
      totalVideoTestimonials,
      totalReviews,
      totalFAQs,
      totalBookings,
      pendingBookings,
      totalContacts,
      unreadMessages,
      totalBrands,
    ] = await Promise.all([
      GalleryImage.countDocuments({}),
      GalleryImage.countDocuments({ featured: true }),
      Film.countDocuments({}),
      Service.countDocuments({}),
      Testimonial.countDocuments({}),
      VideoTestimonial.countDocuments({}),
      Review.countDocuments({}),
      FAQ.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ status: 'pending' }),
      Contact.countDocuments({}),
      Contact.countDocuments({ read: false }),
      Brand.countDocuments({}),
    ]);

    const [recentBookings, recentContactsList] = await Promise.all([
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name email serviceType date status createdAt')
        .lean(),
      Contact.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name email subject message read createdAt')
        .lean(),
    ]);

    const statsObj = {
      totalImages,
      galleryImages: totalImages,
      homepageGalleryCount,
      totalFilms,
      films: totalFilms,
      totalServices,
      services: totalServices,
      totalTestimonials,
      testimonials: totalTestimonials,
      totalVideoTestimonials,
      videoTestimonials: totalVideoTestimonials,
      totalReviews,
      reviews: totalReviews,
      totalFAQs,
      faqs: totalFAQs,
      totalBrands,
      bookings: totalBookings,
      contacts: totalContacts,
      lastUpdated: new Date().toISOString(),
    };

    const result = {
      ...statsObj,
      stats: statsObj,
      recentContacts: unreadMessages,
      pendingBookings,
      totalBookings,
      unreadMessages,
      totalContacts,
      recentBookings: serializeDoc(recentBookings),
      recentContactsList: serializeDoc(recentContactsList),
    };

    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
