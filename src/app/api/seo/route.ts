import { NextResponse } from 'next/server';
import SEO from '@/models/SEO';
import { requireAuth } from '@/lib/auth';
import { CmsError, requireDatabase, serialize, stripPersistenceFields } from '@/lib/cmsDatabase';
import { triggerRevalidation } from '@/lib/revalidate';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const fail = (error: unknown) => NextResponse.json({ error: error instanceof Error ? error.message : 'SEO request failed' }, { status: error instanceof CmsError ? error.status : 500, headers });
export async function GET() { try { await requireDatabase(); const seo = await (SEO as any).findOne().sort({ updatedAt: -1 }).lean(); return NextResponse.json(seo ? serialize(seo) : null, { headers }); } catch (error) { console.error('SEO GET error:', error); return fail(error); } }
export async function PUT(request: Request) { try { if (!requireAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers }); const body = await request.json(); await requireDatabase(); const saved = await (SEO as any).findOneAndUpdate({}, { $set: stripPersistenceFields(body) }, { new: true, upsert: true, runValidators: true }).lean(); if (!saved) throw new CmsError('SEO write failed.'); const verified = await (SEO as any).findById(saved._id).lean(); if (!verified) throw new CmsError('SEO write verification failed.'); triggerRevalidation(); return NextResponse.json(serialize(verified), { headers }); } catch (error) { console.error('SEO PUT error:', error); return fail(error); } }
