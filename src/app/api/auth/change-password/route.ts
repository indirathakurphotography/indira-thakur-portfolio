import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { connectDb } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const tokenUser = getAuthUser(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 12) {
      return NextResponse.json({ error: 'New password must be at least 12 characters' }, { status: 400 });
    }

    await connectDb();

    const user = await User.findOne({ email: tokenUser.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { $set: { password: hashedNew } });

    // Read-after-write verification: confirm the new hash persisted and validates
    const updated = await User.findById(user._id).select('password');
    if (!updated || !updated.password) {
      return NextResponse.json({ error: 'Read-after-write verification failed: password was not persisted.' }, { status: 500 });
    }

    const persisted = await updated.comparePassword(newPassword);
    if (!persisted) {
      return NextResponse.json({ error: 'Read-after-write verification failed: new password did not persist.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change password error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to change password' }, { status });
  }
}
