import { connectToDatabase } from '@/lib/mongodb';
import PageView from '@/models/PageView';

const PageViewModel = PageView as any;

export interface PageViewItem {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  city?: string;
  sessionId: string;
  timestamp: string;
}

declare global {
  var __inMemoryPageViews: PageViewItem[] | undefined;
}

function getInMemoryPageViews(): PageViewItem[] {
  if (!global.__inMemoryPageViews) {
    global.__inMemoryPageViews = [];
  }
  return global.__inMemoryPageViews;
}

export async function recordPageView(data: {
  path: string;
  referrer?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ip?: string;
  country?: string;
  city?: string;
  sessionId: string;
}): Promise<boolean> {
  const item: PageViewItem = {
    path: data.path || '/',
    referrer: data.referrer || '',
    device: data.device || 'desktop',
    browser: data.browser || 'Unknown',
    os: data.os || 'Unknown',
    ip: data.ip || '127.0.0.1',
    country: data.country || '',
    city: data.city || '',
    sessionId: data.sessionId || `anon_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      await PageView.create({
        ...item,
        timestamp: new Date(item.timestamp),
      });
      return true;
    }
  } catch (err) {
    console.warn('MongoDB recordPageView warning, recording to memory cache:', err);
  }

  const mem = getInMemoryPageViews();
  mem.unshift(item);
  if (mem.length > 5000) mem.pop();
  return true;
}

export async function getAnalyticsStats() {
  let views: PageViewItem[] = [];

  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoViews = await PageViewModel.find({})
        .sort({ timestamp: -1 })
        .limit(3000)
        .lean();

      if (mongoViews && mongoViews.length > 0) {
        views = mongoViews.map((pv: any) => ({
          path: String(pv.path || '/'),
          referrer: String(pv.referrer || ''),
          device: (pv.device as 'mobile' | 'tablet' | 'desktop') || 'desktop',
          browser: String(pv.browser || 'Unknown'),
          os: String(pv.os || 'Unknown'),
          ip: String(pv.ip || '127.0.0.1'),
          country: String(pv.country || ''),
          city: String(pv.city || ''),
          sessionId: String(pv.sessionId || ''),
          timestamp: new Date(pv.timestamp as string | number | Date).toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn('MongoDB getAnalyticsStats warning, using in-memory store:', err);
  }

  if (views.length === 0) {
    views = getInMemoryPageViews();
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalPageViews = views.length;
  const uniqueVisitors = new Set(views.map((v) => v.sessionId)).size;
  const todayViews = views.filter((v) => v.timestamp.startsWith(todayStr)).length;
  const weekViews = views.filter((v) => new Date(v.timestamp) >= oneWeekAgo).length;
  const monthViews = views.filter((v) => new Date(v.timestamp) >= oneMonthAgo).length;

  // Device breakdown
  const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
  views.forEach((v) => {
    if (v.device === 'mobile') deviceBreakdown.mobile++;
    else if (v.device === 'tablet') deviceBreakdown.tablet++;
    else deviceBreakdown.desktop++;
  });

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  views.forEach((v) => {
    const b = v.browser && v.browser !== 'Unknown' ? v.browser : 'Other';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  });
  const browserBreakdown = Object.entries(browserCounts)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // OS breakdown
  const osCounts: Record<string, number> = {};
  views.forEach((v) => {
    const os = v.os && v.os !== 'Unknown' ? v.os : 'Other';
    osCounts[os] = (osCounts[os] || 0) + 1;
  });
  const osBreakdown = Object.entries(osCounts)
    .map(([os, count]) => ({ os, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Referrer breakdown
  const referrerCounts: Record<string, number> = {};
  views.forEach((v) => {
    let ref = v.referrer?.trim() || '';
    if (!ref) {
      ref = 'Direct';
    } else {
      try {
        const url = new URL(ref);
        ref = url.hostname.replace(/^www\./, '');
      } catch {
        ref = 'Referral';
      }
    }
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const referrerBreakdown = Object.entries(referrerCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Country breakdown
  const countryCounts: Record<string, number> = {};
  views.forEach((v) => {
    const c = v.country ? v.country.toUpperCase() : 'India (Default)';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const countryBreakdown = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Top pages
  const pageCounts: Record<string, number> = {};
  views.forEach((v) => {
    const p = v.path.split('?')[0] || '/';
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });

  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({
      path,
      count,
      percentage: totalPageViews > 0 ? Math.round((count / totalPageViews) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Daily trends for last 14 days
  const dailyTrends: { date: string; views: number; visitors: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayViews = views.filter((v) => v.timestamp.startsWith(dateStr));
    const dayVisitors = new Set(dayViews.map((v) => v.sessionId)).size;
    dailyTrends.push({
      date: dateStr,
      views: dayViews.length,
      visitors: dayVisitors,
    });
  }

  // Recent activity (last 50)
  const recentActivity = views.slice(0, 50);

  return {
    totalPageViews,
    uniqueVisitors,
    todayViews,
    weekViews,
    monthViews,
    deviceBreakdown,
    browserBreakdown,
    osBreakdown,
    referrerBreakdown,
    countryBreakdown,
    topPages,
    dailyTrends,
    recentActivity,
  };
}
