import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import GalleryImage from '@/models/GalleryImage';
import Service from '@/models/Service';
import Testimonial from '@/models/Testimonial';
import Review from '@/models/Review';
import FAQ from '@/models/FAQ';
import Contact from '@/models/Contact';
import Film from '@/models/Film';
import VideoTestimonial from '@/models/VideoTestimonial';
import Brand from '@/models/Brand';
import PageView from '@/models/PageView';
import LoginLog from '@/models/LoginLog';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    await connectDb();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const [
      totalImages,
      homepageGalleryCount,
      totalFilms,
      totalServices,
      totalTestimonials,
      totalVideoTestimonials,
      totalReviews,
      totalFAQs,
      totalContacts,
      unreadMessages,
      totalBrands,
      totalPageViews,
      recentPageViewsList,
      recentContactsList,
      recentLoginsList,
      failedLoginsCount,
      activeSessionsCount,
      recentAuditLogs,
    ] = await Promise.all([
      GalleryImage.countDocuments({}),
      GalleryImage.countDocuments({ featured: true }),
      Film.countDocuments({}),
      Service.countDocuments({}),
      Testimonial.countDocuments({}),
      VideoTestimonial.countDocuments({}),
      Review.countDocuments({}),
      FAQ.countDocuments({}),
      Contact.countDocuments({}),
      Contact.countDocuments({ read: false }),
      Brand.countDocuments({}),
      PageView.countDocuments({}),
      PageView.find({}).sort({ timestamp: -1 }).limit(10).lean(),
      Contact.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      LoginLog.find({}).sort({ loginTime: -1 }).limit(6).lean(),
      LoginLog.countDocuments({ status: 'failed' }),
      LoginLog.countDocuments({ status: 'success' }),
      AuditLog.find({}).sort({ timestamp: -1 }).limit(6).lean(),
    ]);

    // Calculate unique visitors & today views from recent PageViews if available
    const todayViewsCount = await PageView.countDocuments({
      timestamp: { $gte: new Date(todayStr) },
    });

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
      totalContacts,
      unreadMessages,
      contacts: totalContacts,
      totalPageViews,
      todayPageViews: todayViewsCount,
      failedLoginsCount,
      activeSessionsCount,
      lastUpdated: new Date().toISOString(),
    };

    const result = {
      ...statsObj,
      stats: statsObj,
      recentContacts: unreadMessages,
      unreadMessages,
      totalContacts,
      recentContactsList: serializeDoc(recentContactsList),
      recentPageViewsList: serializeDoc(recentPageViewsList),
      recentLoginsList: serializeDoc(recentLoginsList),
      recentAuditLogs: serializeDoc(recentAuditLogs),
    };

    return NextResponse.json(result, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Dashboard GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to fetch dashboard statistics' }, { status, headers: NO_CACHE_HEADERS });
  }
}
