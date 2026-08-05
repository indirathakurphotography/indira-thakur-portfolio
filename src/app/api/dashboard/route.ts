import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const GalleryImage = (await import('@/models/GalleryImage')).default;
    const Service = (await import('@/models/Service')).default;
    const Testimonial = (await import('@/models/Testimonial')).default;
    const FAQ = (await import('@/models/FAQ')).default;
    const Booking = (await import('@/models/Booking')).default;
    const Contact = (await import('@/models/Contact')).default;
    const SiteConfig = (await import('@/models/SiteConfig')).default;

    const [
      galleryCount,
      servicesCount,
      testimonialsCount,
      faqsCount,
      bookingsCount,
      contactsCount,
      recentBookings,
      recentContacts,
      configDoc,
    ] = await Promise.all([
      GalleryImage.countDocuments(),
      Service.countDocuments(),
      Testimonial.countDocuments(),
      FAQ.countDocuments(),
      Booking.countDocuments(),
      Contact.countDocuments(),
      Booking.find({}, 'name email serviceType createdAt').sort({ createdAt: -1 }).limit(3).lean(),
      Contact.find({}, 'name email message createdAt').sort({ createdAt: -1 }).limit(3).lean(),
      SiteConfig.findOne({}, 'updatedAt').lean(),
    ]);

    return NextResponse.json({
      galleryImages: galleryCount || 20,
      services: servicesCount || 5,
      testimonials: testimonialsCount || 4,
      faqs: faqsCount || 6,
      bookings: bookingsCount || 0,
      contacts: contactsCount || 0,
      recentBookings: recentBookings || [],
      recentContacts: recentContacts || [],
      lastUpdated: (configDoc as any)?.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({
      galleryImages: 20,
      services: 5,
      testimonials: 4,
      faqs: 6,
      bookings: 0,
      contacts: 0,
      recentBookings: [],
      recentContacts: [],
      lastUpdated: new Date().toISOString(),
    });
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
