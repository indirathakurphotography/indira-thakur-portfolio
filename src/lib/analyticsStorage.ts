import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import PageView from '@/models/PageView';

export interface PageViewItem {
  path: string;
  referrer?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  sessionId: string;
  timestamp: string;
}

const FALLBACK_ANALYTICS_PATH = path.join('/tmp', 'pageviews_fallback_store.json');
let memoryStore: PageViewItem[] | null = null;

function loadFallbackStore(): PageViewItem[] {
  if (memoryStore) return memoryStore;
  try {
    if (fs.existsSync(FALLBACK_ANALYTICS_PATH)) {
      const content = fs.readFileSync(FALLBACK_ANALYTICS_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[analyticsStorage] Error reading fallback store:', err);
  }
  memoryStore = [];
  return memoryStore;
}

function saveFallbackStore(data: PageViewItem[]) {
  // Keep last 5000 records max to avoid high memory
  const trimmed = data.slice(-5000);
  memoryStore = trimmed;
  try {
    fs.writeFileSync(FALLBACK_ANALYTICS_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[analyticsStorage] Error writing fallback store:', err);
  }
}

export async function recordPageView(data: {
  path: string;
  referrer?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  sessionId: string;
}): Promise<boolean> {
  const item: PageViewItem = {
    path: data.path || '/',
    referrer: data.referrer || '',
    device: data.device || 'desktop',
    browser: data.browser || 'Unknown',
    os: data.os || 'Unknown',
    sessionId: data.sessionId || `anon_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      await (PageView as any).create({
        ...item,
        timestamp: new Date(item.timestamp),
      });
    }
  } catch (err) {
    console.warn('[analyticsStorage] DB record error, fallback store used:', err);
  }

  const list = loadFallbackStore();
  list.push(item);
  saveFallbackStore(list);
  return true;
}

export async function getAnalyticsStats() {
  let views: PageViewItem[] = [];

  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoViews = await (PageView as any).find({})
        .sort({ timestamp: -1 })
        .limit(2000)
        .lean();

      if (mongoViews && mongoViews.length > 0) {
        views = mongoViews.map((pv: Record<string, unknown>) => ({
          path: String(pv.path || '/'),
          referrer: String(pv.referrer || ''),
          device: (pv.device as 'mobile' | 'tablet' | 'desktop') || 'desktop',
          browser: String(pv.browser || 'Unknown'),
          os: String(pv.os || 'Unknown'),
          sessionId: String(pv.sessionId || ''),
          timestamp: new Date(pv.timestamp as string | number | Date).toISOString(),
        }));
      }
    }
  } catch (err) {
    console.warn('[analyticsStorage] DB fetch error, fallback store used:', err);
  }

  if (views.length === 0) {
    views = loadFallbackStore();
  }

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
