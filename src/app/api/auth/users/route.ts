import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getTokenUser(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/auth_token=([^;]+)/);
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET) as unknown as { email: string; role: string };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const tokenUser = getTokenUser(request);
    if (!tokenUser || tokenUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        users: [{
          _id: 'env-admin',
          name: 'Admin',
          email: 'admin@indirathakur.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        }],
      });
    }

    const { connectToDatabase } = await import('@/lib/mongodb');
    const User = (await import('@/models/User')).default;
    await connectToDatabase();
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const tokenUser = getTokenUser(request);
    if (!tokenUser || tokenUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Database not configured. Set MONGODB_URI to enable user management.' }, { status: 400 });
    }

    const { name, email, password, role } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const { connectToDatabase } = await import('@/lib/mongodb');
    const User = (await import('@/models/User')).default;
    await connectToDatabase();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashedPassword, role: role || 'editor' });

    return NextResponse.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const tokenUser = getTokenUser(request);
    if (!tokenUser || tokenUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
    }

    const { id, name, email, password, role } = await request.json();
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const { connectToDatabase } = await import('@/lib/mongodb');
    const User = (await import('@/models/User')).default;
    await connectToDatabase();

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const tokenUser = getTokenUser(request);
    if (!tokenUser || tokenUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const { connectToDatabase } = await import('@/lib/mongodb');
    const User = (await import('@/models/User')).default;
    await connectToDatabase();
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
