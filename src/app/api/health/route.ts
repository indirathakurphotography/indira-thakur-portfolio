import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase } from '@/lib/cmsDatabase';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) { try { if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const connection = await requireDatabase(); return NextResponse.json({ database: 'connected', mongooseState: connection.connection.readyState, checkedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } }); } catch (error) { return NextResponse.json({ database: 'unavailable', error: error instanceof Error ? error.message : 'Health check failed' }, { status: error instanceof CmsError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } }); } }
