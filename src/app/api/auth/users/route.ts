import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { requireAdmin, connectDb, parseObjectId, serializeDoc } from '@/lib/cmsDatabase';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    await connectDb();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
    return NextResponse.json({ users: serializeDoc(users) }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Database query failed' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const { name, email, password, role } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }

    await connectDb();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user: any = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'admin',
      isActive: true,
    });

    // Read-after-write verification
    const fresh = await User.findById(user._id).select('-password').lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: user was not found in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json({ user: serializeDoc(fresh) }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create user' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin(request);

    const { id, _id, name, email, password, role, isActive } = await request.json();
    const targetId = id || _id;
    if (!targetId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    await connectDb();
    const objectId = parseObjectId(targetId);

    const updateData: Record<string, any> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password.trim(), 12);
    }

    const user: any = await User.findByIdAndUpdate(objectId, { $set: updateData }, { new: true }).select('-password').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Read-after-write verification
    const fresh = await User.findById(objectId).select('-password').lean();
    if (!fresh) {
      return NextResponse.json({ error: 'Read-after-write verification failed: user was not found in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json({ user: serializeDoc(fresh) }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users PUT error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to update user' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireAdmin(request);

    const { id, _id } = await request.json();
    const targetId = id || _id;
    if (!targetId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const objectId = parseObjectId(targetId);
    if (actor.userId === targetId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
    }

    await connectDb();
    const result = await User.deleteOne({ _id: objectId });
    if (result.deletedCount !== 1) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Delete verification
    const check = await User.findById(objectId).lean();
    if (check) {
      return NextResponse.json({ error: 'Delete verification failed: user still exists in MongoDB.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete user' }, { status, headers: NO_CACHE_HEADERS });
  }
}
