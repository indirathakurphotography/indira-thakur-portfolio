import jwt from 'jsonwebtoken';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'indira-thakur-photography-jwt-secret-key-2026';
}

export const JWT_SECRET = getJwtSecret();

export interface TokenUser {
  email: string;
  role: string;
  name?: string;
  userId?: string;
}

export function getAuthUser(request: Request): TokenUser | null {
  const secret = getJwtSecret();

  // 1. Check Authorization header
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim().replace(/^["']|["']$/g, '');
    try {
      return jwt.verify(token, secret) as unknown as TokenUser;
    } catch {
      // Continue to next checks
    }
  }

  // 2. Check x-auth-token header
  const xAuthToken = request.headers.get('x-auth-token');
  if (xAuthToken) {
    const token = xAuthToken.trim().replace(/^["']|["']$/g, '');
    try {
      return jwt.verify(token, secret) as unknown as TokenUser;
    } catch {
      // Continue to next checks
    }
  }

  // 3. Check auth_token cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (match) {
    let tokenVal = match[1];
    try {
      tokenVal = decodeURIComponent(tokenVal);
    } catch {
      // Keep raw if decode fails
    }
    tokenVal = tokenVal.trim().replace(/^["']|["']$/g, '');
    try {
      return jwt.verify(tokenVal, secret) as unknown as TokenUser;
    } catch {
      // Token invalid
    }
  }

  return null;
}

export function requireAuth(request: Request): TokenUser | null {
  return getAuthUser(request);
}

