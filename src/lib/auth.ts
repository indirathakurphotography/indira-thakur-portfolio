import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'indira-thakur-photography-jwt-secret-key-2026';
}

export const JWT_SECRET = getJwtSecret();

let currentGlobalAuthGeneration = 2;

export function getGlobalAuthGeneration(): number {
  return currentGlobalAuthGeneration;
}

export function bumpGlobalAuthGeneration(): number {
  currentGlobalAuthGeneration += 1;
  return currentGlobalAuthGeneration;
}

export function setGlobalAuthGeneration(v: number): void {
  if (typeof v === 'number' && v > 0) {
    currentGlobalAuthGeneration = v;
  }
}

export interface TokenUser {
  email: string;
  role: string;
  name?: string;
  userId?: string;
  sessionId?: string;
  authGeneration?: number;
}

export function getAuthUser(request: Request): TokenUser | null {
  const secret = getJwtSecret();
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

    // Check authGeneration (global session invalidation check)
    if (typeof decoded.authGeneration === 'number' && decoded.authGeneration < currentGlobalAuthGeneration) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

export function requireAuth(request: Request): TokenUser | null {
  return getAuthUser(request);
}
