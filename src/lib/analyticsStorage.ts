import { connectToDatabase } from '@/lib/mongodb';
import PageView from '@/models/PageView';

const PageViewModel = PageView as any;

export interface PageViewItem {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  sessionId: string;
  timestamp: string;
}

export async function recordPageView(data: {
  path: string;
  referrer?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  sessionId: string;
}): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to record page view.');
  }

  const item = {
    path: data.path || '/',
    referrer: data.referrer || '',
    device: data.device || 'desktop',
    browser: data.browser || 'Unknown',
    os: data.os || 'Unknown',
    sessionId: data.sessionId || `anon_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
  };

  await PageView.create(item);

  // Read-after-write verification
  const fresh = await PageViewModel.findOne({
    sessionId: item.sessionId,
    path: item.path,
  })
    .sort({ timestamp: -1 })
    .lean();

  if (!fresh) {
    throw new Error('Read-after-write verification failed: page view was not persisted in MongoDB.');
  }

  return true;
}

export async function getAnalyticsStats() {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read analytics.');
  }

  const mongoViews = await PageViewModel.find({})
    .sort({ timestamp: -1 })
    .limit(2000)
    .lean();

  const views: PageViewItem[] = (mongoViews || []).map((pv) => ({
    path: String(pv.path || '/'),
    referrer: String(pv.referrer || ''),
    device: (pv.device as 'mobile' | 'tablet' | 'desktop') || 'desktop',
    browser: String(pv.browser || 'Unknown'),
    os: String(pv.os || 'Unknown'),
    sessionId: String(pv.sessionId || ''),
    timestamp: new Date(pv.timestamp as string | number | Date).toISOString(),
  }));

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const totalPageViews = views.length;
  const uniqueVisitors = new Set(views.map(v => v.sessionId)).size;
  const todayViews = views.filter(v => v.timestamp.startsWith(todayStr)).length;

  // Device breakdown
  const deviceBreakdown = { mobile: 0, tablet: 0, desktop: 0 };
  views.forEach(v => {
    if (v.device === 'mobile') deviceBreakdown.mobile++;
    else if (v.device === 'tablet') deviceBreakdown.tablet++;
    else deviceBreakdown.desktop++;
  });

  // Top pages
  const pageCounts: Record<string, number> = {};
  views.forEach(v => {
    const p = v.path.split('?')[0] || '/';
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });

  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Daily trends for last 7 days
  const dailyTrends: { date: string; views: number; visitors: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayViews = views.filter(v => v.timestamp.startsWith(dateStr));
    const dayVisitors = new Set(dayViews.map(v => v.sessionId)).size;
    dailyTrends.push({
      date: dateStr,
      views: dayViews.length,
      visitors: dayVisitors,
    });
  }

  // Recent activity
  const recentActivity = views.slice(0, 15);

  return {
    totalPageViews,
    uniqueVisitors,
    todayViews,
    deviceBreakdown,
    topPages,
    dailyTrends,
    recentActivity,
  };
}
