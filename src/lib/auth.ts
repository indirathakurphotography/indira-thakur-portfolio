import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'dev-secret-key-indira-photography-portfolio';
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

export interface InMemoryUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor';
  isActive: boolean;
  isBlocked?: boolean;
  status: 'active' | 'disabled' | 'blocked';
  authGeneration: number;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InMemoryLoginLog {
  _id: string;
  email: string;
  ip: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  device?: string;
  status: 'success' | 'failed' | 'revoked' | 'logged_out';
  sessionId: string;
  loginTime: string;
  logoutTime?: string;
}

declare global {
  var __inMemoryUsers: InMemoryUser[] | undefined;
  var __inMemoryLoginLogs: InMemoryLoginLog[] | undefined;
}

export function getInMemoryUsers(): InMemoryUser[] {
  if (!global.__inMemoryUsers) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@12345678', salt);
    global.__inMemoryUsers = [
      {
        _id: 'usr_admin_default',
        id: 'usr_admin_default',
        name: 'Indira Thakur',
        email: 'admin@indirathakur.com',
        passwordHash: hash,
        role: 'admin',
        isActive: true,
        isBlocked: false,
        status: 'active',
        authGeneration: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
  return global.__inMemoryUsers;
}

export function getInMemoryLoginLogs(): InMemoryLoginLog[] {
  if (!global.__inMemoryLoginLogs) {
    global.__inMemoryLoginLogs = [];
  }
  return global.__inMemoryLoginLogs;
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
    if (!decoded || (!decoded.email && !decoded.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * DB-backed authentication. Verifies the JWT signature AND that the session
 * generation recorded in the token still matches the user's CURRENT
 * `authGeneration` stored in MongoDB / in-memory store. Any token issued before a global
 * logout / password reset (generation bump) is rejected here.
 *
 * Fails CLOSED: if the user was deleted, deactivated, the generation no
 * longer matches, or the database is unreachable, the request is rejected.
 */
export async function verifyAuthUser(request: Request): Promise<TokenUser | null> {
  const tokenUser = getAuthUser(request);
  if (!tokenUser) return null;

  try {
    const { connectToDatabase } = await import('@/lib/mongodb');
    const mongoose = (await import('mongoose')).default;
    const User = (await import('@/models/User')).default;

    const db = await connectToDatabase();
    if (db) {
      if (tokenUser.userId && mongoose.Types.ObjectId.isValid(tokenUser.userId)) {
        const dbUser: any = await User.findById(tokenUser.userId).lean();
        if (!dbUser) return null;
        if (dbUser.isActive === false || dbUser.isBlocked === true || dbUser.status === 'blocked' || dbUser.status === 'disabled') {
          return null;
        }

        const dbGeneration = typeof dbUser.authGeneration === 'number' ? dbUser.authGeneration : 1;
        const tokenGeneration = typeof tokenUser.authGeneration === 'number' ? tokenUser.authGeneration : 0;

        if (tokenGeneration < dbGeneration) return null;

        if (tokenUser.sessionId) {
          const LoginLog = (await import('@/models/LoginLog')).default;
          const log = await LoginLog.findOne({ sessionId: tokenUser.sessionId }).select('status').lean();
          if (log && log.status === 'revoked') {
            return null;
          }
        }

        return {
          email: dbUser.email,
          role: dbUser.role || 'admin',
          name: dbUser.name,
          userId: String(dbUser._id),
          sessionId: tokenUser.sessionId,
          authGeneration: dbGeneration,
        };
      }
    }
  } catch (err) {
    console.warn('MongoDB verifyAuthUser check error, checking in-memory store:', err);
  }

  // Fallback in-memory verification
  const memUsers = getInMemoryUsers();
  const memUser = memUsers.find(
    (u) =>
      u._id === tokenUser.userId ||
      u.id === tokenUser.userId ||
      u.email.toLowerCase() === tokenUser.email.toLowerCase()
  );

  if (!memUser) return null;
  if (memUser.isActive === false || memUser.isBlocked === true || memUser.status === 'blocked' || memUser.status === 'disabled') {
    return null;
  }

  const memGeneration = typeof memUser.authGeneration === 'number' ? memUser.authGeneration : 1;
  const tokenGen = typeof tokenUser.authGeneration === 'number' ? tokenUser.authGeneration : 0;
  if (tokenGen < memGeneration) return null;

  if (tokenUser.sessionId) {
    const memLogs = getInMemoryLoginLogs();
    const sessionLog = memLogs.find((l) => l.sessionId === tokenUser.sessionId);
    if (sessionLog && sessionLog.status === 'revoked') {
      return null;
    }
  }

  return {
    email: memUser.email,
    role: memUser.role || 'admin',
    name: memUser.name,
    userId: memUser._id,
    sessionId: tokenUser.sessionId,
    authGeneration: memGeneration,
  };
}
