import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import { requireAdmin, connectDb, parseObjectId, serializeDoc } from '@/lib/cmsDatabase';
import { getInMemoryUsers, InMemoryUser } from '@/lib/auth';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { recordAuditLog } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET(request: Request) {
  try {
    await requireAdmin(request);

    try {
      await connectDb();
      const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
      return NextResponse.json({ users: serializeDoc(users) }, { headers: NO_CACHE_HEADERS });
    } catch (dbErr) {
      console.warn('MongoDB users GET warning, returning in-memory store:', dbErr);
      const memUsers = getInMemoryUsers().map((u) => {
        const { passwordHash, ...rest } = u;
        return rest;
      });
      return NextResponse.json({ users: memUsers }, { headers: NO_CACHE_HEADERS });
    }
  } catch (error: any) {
    console.error('Users GET error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Database query failed' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request);

    const { name, email, password, role, isActive, isBlocked, status: userStatus } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }
    if (typeof password !== 'string' || password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }
    assertNoProhibitedLanguage({ name, email });

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 12);
    const resolvedStatus = userStatus || (isBlocked ? 'blocked' : isActive === false ? 'disabled' : 'active');
    const resolvedActive = resolvedStatus === 'active';
    const resolvedBlocked = resolvedStatus === 'blocked';

    let userDoc: any = null;

    try {
      await connectDb();
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }

      const created: any = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: role === 'editor' ? 'editor' : 'admin',
        isActive: resolvedActive,
        isBlocked: resolvedBlocked,
        status: resolvedStatus,
        authGeneration: 1,
      });

      userDoc = await User.findById(created._id).select('-password').lean();
    } catch (dbErr) {
      console.warn('MongoDB user create warning, saving to in-memory store:', dbErr);
      const memUsers = getInMemoryUsers();
      if (memUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
      }

      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser: InMemoryUser = {
        _id: newId,
        id: newId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash: hashedPassword,
        role: role === 'editor' ? 'editor' : 'admin',
        isActive: resolvedActive,
        isBlocked: resolvedBlocked,
        status: resolvedStatus,
        authGeneration: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memUsers.push(newUser);
      userDoc = {
        _id: newUser._id,
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        isBlocked: newUser.isBlocked,
        status: newUser.status,
        authGeneration: newUser.authGeneration,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };
    }

    await recordAuditLog(request, {
      action: 'ADMIN_ACCOUNT_CREATED',
      adminEmail: actor.email,
      adminName: actor.name,
      targetResource: `User: ${userDoc.email}`,
      details: `Created new account with role '${userDoc.role}' and status '${resolvedStatus}'`,
      status: 'success',
    });

    return NextResponse.json({ user: serializeDoc(userDoc) }, { status: 201, headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users POST error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to create user' }, { status, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireAdmin(request);

    const { id, _id, name, email, password, role, isActive, isBlocked, status: userStatus } = await request.json();
    const targetId = id || _id;
    if (!targetId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    assertNoProhibitedLanguage({ name: name || '', email: email || '' });

    const updateData: Record<string, any> = {};
    if (name && typeof name === 'string') updateData.name = name.trim();
    if (email && typeof email === 'string') updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;

    // Resolve status / active / blocked flags
    if (userStatus) {
      updateData.status = userStatus;
      updateData.isActive = userStatus === 'active';
      updateData.isBlocked = userStatus === 'blocked';
    } else if (typeof isBlocked === 'boolean') {
      updateData.isBlocked = isBlocked;
      updateData.status = isBlocked ? 'blocked' : isActive !== false ? 'active' : 'disabled';
      updateData.isActive = !isBlocked && (typeof isActive === 'boolean' ? isActive : true);
    } else if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
      updateData.status = isActive ? 'active' : 'disabled';
      updateData.isBlocked = false;
    }

    let passwordChanged = false;
    let hashedPassword = '';
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 12) {
        return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
      }
      hashedPassword = await bcrypt.hash(password.trim(), 12);
      updateData.password = hashedPassword;
      passwordChanged = true;
    }

    let updatedUserDoc: any = null;

    try {
      await connectDb();
      const objectId = parseObjectId(targetId);
      const existingUser: any = await User.findById(objectId);
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Safety check: Ensure we do not disable, block, or demote the last active admin
      const targetWillBeActiveAdmin =
        (updateData.role || existingUser.role) === 'admin' &&
        (updateData.isActive !== undefined ? updateData.isActive : existingUser.isActive) === true &&
        (updateData.isBlocked !== undefined ? !updateData.isBlocked : !existingUser.isBlocked);

      if (!targetWillBeActiveAdmin) {
        const activeAdminCount = await User.countDocuments({
          _id: { $ne: objectId },
          role: 'admin',
          isActive: { $ne: false },
          isBlocked: { $ne: true },
        });

        if (activeAdminCount === 0) {
          return NextResponse.json(
            { error: 'Cannot disable, block, or remove admin role from the only remaining active administrator.' },
            { status: 400 }
          );
        }
      }

      if (passwordChanged) {
        updateData.authGeneration = (existingUser.authGeneration || 1) + 1;
      }

      updatedUserDoc = await User.findByIdAndUpdate(
        objectId,
        { $set: updateData },
        { new: true }
      ).select('-password').lean();
    } catch (dbErr) {
      console.warn('MongoDB user PUT warning, updating in-memory store:', dbErr);
      const memUsers = getInMemoryUsers();
      const userIndex = memUsers.findIndex((u) => u._id === targetId || u.id === targetId);
      if (userIndex === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const existingMemUser = memUsers[userIndex];
      const targetWillBeActiveAdmin =
        (updateData.role || existingMemUser.role) === 'admin' &&
        (updateData.isActive !== undefined ? updateData.isActive : existingMemUser.isActive) === true &&
        (updateData.isBlocked !== undefined ? !updateData.isBlocked : !existingMemUser.isBlocked);

      if (!targetWillBeActiveAdmin) {
        const activeAdminCount = memUsers.filter(
          (u) => (u._id !== targetId && u.id !== targetId) && u.role === 'admin' && u.isActive !== false && !u.isBlocked
        ).length;
        if (activeAdminCount === 0) {
          return NextResponse.json(
            { error: 'Cannot disable, block, or remove admin role from the only remaining active administrator.' },
            { status: 400 }
          );
        }
      }

      memUsers[userIndex] = {
        ...existingMemUser,
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.email && { email: updateData.email }),
        ...(updateData.role && { role: updateData.role }),
        ...(updateData.status && { status: updateData.status }),
        ...(updateData.isActive !== undefined && { isActive: updateData.isActive }),
        ...(updateData.isBlocked !== undefined && { isBlocked: updateData.isBlocked }),
        ...(passwordChanged && {
          passwordHash: hashedPassword,
          authGeneration: (existingMemUser.authGeneration || 1) + 1,
        }),
        updatedAt: new Date().toISOString(),
      };

      const { passwordHash, ...rest } = memUsers[userIndex];
      updatedUserDoc = rest;
    }

    if (!updatedUserDoc) return NextResponse.json({ error: 'User update failed' }, { status: 500 });

    await recordAuditLog(request, {
      action: passwordChanged ? 'ADMIN_PASSWORD_RESET' : 'ADMIN_ACCOUNT_UPDATED',
      adminEmail: actor.email,
      adminName: actor.name,
      targetResource: `User: ${updatedUserDoc.email}`,
      details: `Updated account details (Status: ${updatedUserDoc.status || (updatedUserDoc.isActive ? 'active' : 'disabled')}${passwordChanged ? ', password reset' : ''})`,
      status: 'success',
    });

    return NextResponse.json({ user: serializeDoc(updatedUserDoc) }, { headers: NO_CACHE_HEADERS });
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

    if (actor.userId === targetId) {
      return NextResponse.json({ error: 'You cannot delete your own administrator account.' }, { status: 400 });
    }

    let deletedEmail = '';
    let deletedName = '';

    try {
      await connectDb();
      const objectId = parseObjectId(targetId);
      const targetUser = await User.findById(objectId).lean();
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (targetUser.role === 'admin' && targetUser.isActive !== false && !targetUser.isBlocked) {
        const activeAdminCount = await User.countDocuments({
          _id: { $ne: objectId },
          role: 'admin',
          isActive: { $ne: false },
          isBlocked: { $ne: true },
        });
        if (activeAdminCount === 0) {
          return NextResponse.json(
            { error: 'Cannot delete the only remaining active administrator account.' },
            { status: 400 }
          );
        }
      }

      await User.deleteOne({ _id: objectId });
      deletedEmail = targetUser.email;
      deletedName = targetUser.name || 'User';
    } catch (dbErr) {
      console.warn('MongoDB user DELETE warning, removing from in-memory store:', dbErr);
      const memUsers = getInMemoryUsers();
      const idx = memUsers.findIndex((u) => u._id === targetId || u.id === targetId);
      if (idx === -1) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const targetMemUser = memUsers[idx];
      if (targetMemUser.role === 'admin' && targetMemUser.isActive !== false && !targetMemUser.isBlocked) {
        const activeAdminCount = memUsers.filter(
          (u) => (u._id !== targetId && u.id !== targetId) && u.role === 'admin' && u.isActive !== false && !u.isBlocked
        ).length;
        if (activeAdminCount === 0) {
          return NextResponse.json(
            { error: 'Cannot delete the only remaining active administrator account.' },
            { status: 400 }
          );
        }
      }

      deletedEmail = targetMemUser.email;
      deletedName = targetMemUser.name || 'User';
      memUsers.splice(idx, 1);
    }

    await recordAuditLog(request, {
      action: 'ADMIN_ACCOUNT_DELETED',
      adminEmail: actor.email,
      adminName: actor.name,
      targetResource: `User: ${deletedEmail}`,
      details: `Deleted account (${deletedName})`,
      status: 'warning',
    });

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Users DELETE error:', error);
    const status = error?.status || 500;
    return NextResponse.json({ error: error?.message || 'Failed to delete user' }, { status, headers: NO_CACHE_HEADERS });
  }
}
