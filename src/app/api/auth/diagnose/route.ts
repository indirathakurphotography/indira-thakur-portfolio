import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const diagnostics: Record<string, any> = {
    jwt_secret_set: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    mongodb_uri_set: !!process.env.MONGODB_URI,
    mongodb_uri_prefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET',
    node_env: process.env.NODE_ENV || 'NOT SET',
    supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon_key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    const adminUser = await User.findOne({ email: 'admin@indirathakur.com' });
    diagnostics.admin_user_exists = !!adminUser;
    diagnostics.admin_user_role = adminUser?.role || 'N/A';
    diagnostics.admin_user_has_password = !!adminUser?.password;
    diagnostics.admin_user_password_length = adminUser?.password?.length || 0;
    diagnostics.total_users = await User.countDocuments();
  } catch (err: any) {
    diagnostics.error = err?.message || String(err);
    diagnostics.error_stack = err?.stack?.split('\n').slice(0, 3).join('\n') || 'N/A';
  }

  return NextResponse.json(diagnostics);
}
