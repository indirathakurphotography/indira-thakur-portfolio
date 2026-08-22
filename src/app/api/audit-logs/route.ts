import { NextResponse } from 'next/server';
import { requireAdmin, connectDb, serializeDoc } from '@/lib/cmsDatabase';
import { getInMemoryAuditLogs } from '@/lib/auditLogger';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 10), 500);
    const action = searchParams.get('action');
    const admin = searchParams.get('admin');

    try {
      await connectDb();

      const filter: Record<string, any> = {};
      if (action && action !== 'ALL' && action !== 'all') {
        filter.action = action;
      }
      if (admin && admin.trim()) {
        filter.adminEmail = { $regex: admin.trim(), $options: 'i' };
      }

      const [logs, totalCount] = await Promise.all([
        AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit).lean(),
        AuditLog.countDocuments(filter),
      ]);

      return NextResponse.json(
        {
          logs: serializeDoc(logs),
          totalCount,
          limit,
        },
        { headers: NO_CACHE_HEADERS }
      );
    } catch (dbErr) {
      console.warn('MongoDB audit logs GET warning, using in-memory store:', dbErr);
      let memLogs = getInMemoryAuditLogs();
      if (action && action !== 'ALL' && action !== 'all') {
        memLogs = memLogs.filter((l) => l.action === action);
      }
      if (admin && admin.trim()) {
        const q = admin.trim().toLowerCase();
        memLogs = memLogs.filter((l) => l.adminEmail?.toLowerCase().includes(q));
      }
      const sliced = memLogs.slice(0, limit);
      return NextResponse.json(
        {
          logs: sliced,
          totalCount: memLogs.length,
          limit,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }
  } catch (error: any) {
    console.error('Audit logs GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch audit logs' },
      { status, headers: NO_CACHE_HEADERS }
    );
  }
}
