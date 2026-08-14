import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || '';
}

export const JWT_SECRET = getJwtSecret();

export interface TokenUser {
  email: string;
  role: string;
  name?: string;
  userId?: string;
  sessionId?: string;
  authGeneration?: number;
}

/**
 * Decodes and verifies the JWT signature from a request (header or cookie).
 * This is a lightweight, synchronous check. It does NOT verify revocation;
 * use `verifyAuthUser` for any request that touches the admin CMS.
 */
export function getAuthUser(request: Request): TokenUser | null {
  const secret = getJwtSecret();
  if (!secret) return null;
  let rawToken: string | null = null;

  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim().replace(/^["']|["']$/g, '');
  }

  // 2. Check x-auth-token header
  if (!rawToken) {
    const xAuthToken = request.headers.get('x-auth-token');
    if (xAuthToken) {
      rawToken = xAuthToken.trim().replace(/^["']|["']$/g, '');
    }
  }

  // 3. Check auth_token cookie
  if (!rawToken) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) {
      let tokenVal = match[1];
      try {
        tokenVal = decodeURIComponent(tokenVal);
      } catch {}
      rawToken = tokenVal.trim().replace(/^["']|["']$/g, '');
    }
  }

  if (!rawToken) return null;

  try {
    const decoded = jwt.verify(rawToken, secret) as TokenUser;
    if (!decoded || !decoded.email) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * DB-backed authentication. Verifies the JWT signature AND that the session
 * generation recorded in the token still matches the user's CURRENT
 * `authGeneration` stored in MongoDB. Any token issued before a global
 * logout / password reset (generation bump) is rejected here.
 *
 * Fails CLOSED: if the user was deleted, deactivated, the generation no
 * longer matches, or the database is unreachable, the request is rejected.
 */
export async function verifyAuthUser(request: Request): Promise<TokenUser | null> {
  const tokenUser = getAuthUser(request);
  if (!tokenUser || !tokenUser.userId) return null;

  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const mongoose = (await import('mongoose')).default;
    const User = (await import('@/models/User')).default;

    if (!mongoose.Types.ObjectId.isValid(tokenUser.userId)) return null;

    await connectToDatabase();
    const dbUser = await User.findById(tokenUser.userId).lean();

    if (!dbUser) return null;
    if (dbUser.isActive === false) return null;

    const dbGeneration = typeof dbUser.authGeneration === 'number' ? dbUser.authGeneration : 1;
    const tokenGeneration = typeof tokenUser.authGeneration === 'number' ? tokenUser.authGeneration : 0;

    // Reject any session token whose generation is older than the user's
    // current generation (e.g. after "Logout All Devices" or password reset).
    if (tokenGeneration < dbGeneration) return null;

    return {
      email: dbUser.email,
      role: dbUser.role || 'admin',
      name: dbUser.name,
      userId: String(dbUser._id),
      sessionId: tokenUser.sessionId,
      authGeneration: dbGeneration,
    };
  } catch {
    return null;
  }
}
