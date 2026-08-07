import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, resetKey } = await request.json();

    if (!email || !newPassword || !resetKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expectedKey = process.env.MIGRATION_KEY || '';
    if (!expectedKey || resetKey !== expectedKey) {
      return NextResponse.json({ error: 'Invalid reset key' }, { status: 403 });
    }

    await connectToDatabase();
    const User = (await import('@/models/User')).default;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
