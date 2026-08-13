import { NextResponse } from 'next/server';
import ThemeSettings from '@/models/ThemeSettings';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : 'Theme request failed' }, { status: error instanceof CmsError ? error.status : 500, headers });
export async function GET() { try { await requireDatabase(); const theme = await (ThemeSettings as any).findOne().sort({ updatedAt: -1 }).lean(); return NextResponse.json(theme ? serialize(theme) : null, { headers }); } catch (error) { console.error('Theme GET error:', error); return fail(error); } }
export async function PUT(request: Request) { try { if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers }); const body = await request.json(); await requireDatabase(); const saved = await (ThemeSettings as any).findOneAndUpdate({}, { $set: stripPersistenceFields(body) }, { new: true, upsert: true, runValidators: true }).lean(); if (!saved) throw new CmsError('Theme write failed.'); const verified = await (ThemeSettings as any).findById(saved._id).lean(); if (!verified) throw new CmsError('Theme write verification failed.'); triggerRevalidation(); return NextResponse.json(serialize(verified), { headers }); } catch (error) { console.error('Theme PUT error:', error); return fail(error); } }
