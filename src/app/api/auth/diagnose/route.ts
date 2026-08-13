import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawEnv = process.env.MONGODB_URI || '';
  const maskedEnv = rawEnv.replace(/:([^@]+)@/, ':***@');
  const { getSanitizedMongoUri } = await import('@/lib/mongodb');
  const sanitized = getSanitizedMongoUri();
  const maskedSanitized = sanitized.replace(/:([^@]+)@/, ':***@');

  const diagnostics: Record<string, any> = {
    jwt_secret_set: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    mongodb_uri_set: !!process.env.MONGODB_URI,
    raw_env_masked: maskedEnv,
    sanitized_uri_masked: maskedSanitized,
    node_env: process.env.NODE_ENV || 'NOT SET',
  };

  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    await connectToDatabase();
    diagnostics.mongodb_connection = 'OK';

    const mongoose = await import('mongoose');
    const state = mongoose.default?.connection?.readyState;
    const states: Record<number, string> = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    diagnostics.mongodb_state = states[state ?? -1] || 'unknown';

    const User = (await import('@/models/User')).default;
    const adminUser = await (User as any).findOne({ email: 'admin@indirathakur.com' });
    diagnostics.admin_user_exists = !!adminUser;
    diagnostics.admin_user_role = adminUser?.role || 'N/A';
    diagnostics.admin_user_has_password = !!adminUser?.password;
    diagnostics.admin_user_password_length = adminUser?.password?.length || 0;
    diagnostics.total_users = await (User as any).countDocuments();
  } catch (err: any) {
    diagnostics.error = err?.message || String(err);
    diagnostics.error_stack = err?.stack?.split('\n').slice(0, 3).join('\n') || 'N/A';
  }

  return NextResponse.json(diagnostics);
}
