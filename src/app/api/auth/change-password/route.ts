import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';
import { CmsError, requireDatabase, serialize } from '@/lib/cmsDatabase';

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
    await requireDatabase();

    const user = await (User as any).findOne({ email: tokenUser.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    const saved = await (User as any).findByIdAndUpdate(user._id, { $set: { password: hashedNew } }, { new: true, runValidators: true }).select('-password').lean();
    if (!saved) throw new CmsError('Password update failed.');
    const verified = await (User as any).findById(user._id).select('-password').lean();
    if (!verified) throw new CmsError('Password update verification failed.');

    return NextResponse.json({ success: true, user: serialize(verified) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to change password' }, { status: error instanceof CmsError ? error.status : 500 });
  }
}
