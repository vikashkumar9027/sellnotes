import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from './mongodb';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'notemart_jwt_super_secret_key_2026_production';
export const AUTH_COOKIE_NAME = 'notemart_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from a NextRequest (API route handler)
 */
export async function getAuthUserFromRequest(request: NextRequest): Promise<IUser | null> {
  try {
    let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('-password');
    return user || null;
  } catch (err) {
    console.warn('Error verifying auth user from request:', err);
    return null;
  }
}

/**
 * Extract authenticated user from server actions / server components
 */
export async function getAuthUserFromCookies(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select('-password');
    return user || null;
  } catch (err) {
    console.warn('Error verifying auth user from cookies:', err);
    return null;
  }
}

/**
 * Attach HTTP-only authentication cookie to response
 */
export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });
  return response;
}

/**
 * Clear authentication cookie from response
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
