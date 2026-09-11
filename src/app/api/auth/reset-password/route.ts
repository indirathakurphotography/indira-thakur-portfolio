import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { recordAuditLog } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, resetKey } = await request.json();

    if (!email || !newPassword || !resetKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Require an explicitly configured secret of sufficient length
    const expectedKey = process.env.ADMIN_RECOVERY_KEY || process.env.MIGRATION_KEY || '';
    if (!expectedKey || expectedKey.length < 16 || !safeCompare(resetKey, expectedKey)) {
      await recordAuditLog(request, {
        action: 'ADMIN_PASSWORD_RESET_FAILED',
        adminEmail: email.toLowerCase(),
        targetResource: `User: ${email}`,
        details: 'Failed password reset attempt with invalid recovery key',
        status: 'failed',
      });
      return NextResponse.json({ error: 'Unauthorized: Invalid recovery key' }, { status: 403 });
    }

    await connectToDatabase();
    const User = (await import('@/models/User')).default;
    let user = await (User as any).findOne({ email: email.toLowerCase() });
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (!user) {
      user = await (User as any).create({
        name: 'Indira Thakur',
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        authGeneration: 1,
      });
    } else {
      user.password = hashedPassword;
      user.authGeneration = (user.authGeneration || 0) + 1;
      await user.save();
    }

    const fresh = await (User as any).findById(user._id).select('password');
    if (!fresh || !fresh.password) {
      return NextResponse.json(
        { error: 'Read-after-write verification failed: password was not persisted.' },
        { status: 500 }
      );
    }
    const persisted = await fresh.comparePassword(newPassword);
    if (!persisted) {
      return NextResponse.json(
        { error: 'Read-after-write verification failed: new password did not persist.' },
        { status: 500 }
      );
    }

    await recordAuditLog(request, {
      action: 'ADMIN_PASSWORD_RESET_SUCCESS',
      adminEmail: email.toLowerCase(),
      targetResource: `User: ${email}`,
      details: 'Administrator account password successfully reset via secure recovery key',
      status: 'success',
    });

    return NextResponse.json({ success: true, message: 'Admin credentials updated successfully' });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 500 });
  }
}
