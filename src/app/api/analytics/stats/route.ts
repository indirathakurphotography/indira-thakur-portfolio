import { NextRequest, NextResponse } from 'next/server';
import PageView from '@/models/PageView';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase } from '@/lib/cmsDatabase';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) { try { if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); await requireDatabase(); const [totalViews, pages, devices, recent] = await Promise.all([(PageView as any).countDocuments(), (PageView as any).aggregate([{ $group: { _id: '$path', views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 10 }]), (PageView as any).aggregate([{ $group: { _id: '$device', views: { $sum: 1 } } }]), (PageView as any).find().sort({ timestamp: -1 }).limit(20).lean()]); return NextResponse.json({ totalViews, pages, devices, recent }, { headers: { 'Cache-Control': 'no-store' } }); } catch (error) { console.error('[analytics/stats] Error:', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Analytics request failed' }, { status: error instanceof CmsError ? error.status : 500 }); } }
