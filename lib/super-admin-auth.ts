import crypto from 'crypto';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';

const SUPER_ADMIN_COOKIE_NAME = 'notemart_super_admin_session';

// Rate limiting state for Super Admin login: IP/email -> attempts and lock timestamp
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}

const globalRateLimit = globalThis as unknown as {
  adminRateLimits?: Record<string, RateLimitEntry>;
  adminSessions?: Record<string, { email: string; expiresAt: number }>;
};

const rateLimits: Record<string, RateLimitEntry> = globalRateLimit.adminRateLimits || {};
const activeSessions: Record<string, { email: string; expiresAt: number }> = globalRateLimit.adminSessions || {};

globalRateLimit.adminRateLimits = rateLimits;
globalRateLimit.adminSessions = activeSessions;

/**
 * Verifies a password against a stored secure password hash
 * Supports Scrypt, PBKDF2, and SHA256/HMAC
 */
export function verifyPasswordHash(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  try {
    // Format 1: scrypt$salt$hash
    if (storedHash.startsWith('scrypt$')) {
      const parts = storedHash.split('$');
      if (parts.length === 3) {
        const salt = parts[1];
        const key = parts[2];
        const derived = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(key));
      }
    }

    // Format 2: pbkdf2$iterations$salt$hash
    if (storedHash.startsWith('pbkdf2$')) {
      const parts = storedHash.split('$');
      if (parts.length === 4) {
        const iterations = parseInt(parts[1], 10) || 100000;
        const salt = parts[2];
        const key = parts[3];
        const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
        return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(key));
      }
    }

    // Format 3: Simple SHA-256 fallback for testing/initial env (when provided as hex)
    if (storedHash.length === 64 && /^[0-9a-f]+$/i.test(storedHash)) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
    }

    // Format 4: Bcrypt-style or plain comparison fallback if user sets direct value
    // Constant-time comparison
    const passwordBuffer = Buffer.from(password);
    const storedBuffer = Buffer.from(storedHash);
    if (passwordBuffer.length === storedBuffer.length) {
      return crypto.timingSafeEqual(passwordBuffer, storedBuffer);
    }

    return false;
  } catch (err) {
    console.error('Password hash verification failed:', err);
    return false;
  }
}

/**
 * Creates a strong Scrypt hash of a password for provisioning
 */
export function hashPasswordScrypt(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

/**
 * Super Admin Login Action with Rate Limiting and Timing Attack Protection
 */
export async function authenticateSuperAdmin(
  emailInput: string,
  passwordInput: string,
  ip: string = '127.0.0.1'
): Promise<{ success: boolean; error?: string }> {
  const configuredEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@notemart.com';
  const configuredHash = process.env.SUPER_ADMIN_PASSWORD_HASH;

  // Rate Limiting Check: 5 attempts max, 15 minute lockout
  const key = `${ip}_${emailInput.toLowerCase().trim()}`;
  const record = rateLimits[key] || { attempts: 0, lockedUntil: 0 };

  if (Date.now() < record.lockedUntil) {
    const minutesLeft = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return {
      success: false,
      error: `Too many failed login attempts. Please wait ${minutesLeft} minute(s) before trying again.`,
    };
  }

  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanConfigEmail = configuredEmail.trim().toLowerCase();

  // Validate email match
  const isEmailMatch = cleanEmail === cleanConfigEmail;

  // If no password hash is set in Vercel env yet, provide a secure warning
  if (!configuredHash) {
    console.error('[SECURITY ALERT] SUPER_ADMIN_PASSWORD_HASH is not set in environment variables.');
    return {
      success: false,
      error: 'Invalid credentials', // Generic error - never reveals config details
    };
  }

  const isPasswordMatch = verifyPasswordHash(passwordInput, configuredHash);

  if (!isEmailMatch || !isPasswordMatch) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      record.lockedUntil = Date.now() + 15 * 60 * 1000; // 15 mins lock
    }
    rateLimits[key] = record;

    store.recordAuditLog({
      admin_id: cleanEmail || 'unknown',
      action: 'ADMIN_LOGIN_FAILED',
      target: 'Super Admin Portal',
      ip_address: ip,
      result: 'FAILURE',
      metadata: { attempts: record.attempts },
    });

    return {
      success: false,
      error: 'Invalid credentials', // Generic error - never reveals whether email exists
    };
  }

  // Reset rate limit on success
  delete rateLimits[key];

  // Generate cryptographically secure session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionExpiry = Date.now() + 8 * 60 * 60 * 1000; // 8 hours validity

  activeSessions[sessionToken] = {
    email: cleanConfigEmail,
    expiresAt: sessionExpiry,
  };

  const cookieStore = await cookies();
  cookieStore.set(SUPER_ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60,
    path: '/',
  });

  store.recordAuditLog({
    admin_id: cleanConfigEmail,
    action: 'ADMIN_LOGIN',
    target: 'Super Admin Portal',
    ip_address: ip,
    result: 'SUCCESS',
  });

  return { success: true };
}

/**
 * Validates whether the active request has an authenticated Super Admin session
 */
export async function verifySuperAdminSession(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;

    if (!token) {
      return { authenticated: false };
    }

    const session = activeSessions[token];
    if (!session || Date.now() > session.expiresAt) {
      if (token in activeSessions) {
        delete activeSessions[token];
      }
      return { authenticated: false };
    }

    return { authenticated: true, email: session.email };
  } catch {
    return { authenticated: false };
  }
}

/**
 * Server-side guard to require Super Admin authorization
 */
export async function requireSuperAdmin(): Promise<{ authorized: boolean; email?: string }> {
  const session = await verifySuperAdminSession();
  if (!session.authenticated) {
    return { authorized: false };
  }
  return { authorized: true, email: session.email };
}

/**
 * Super Admin Logout Action
 */
export async function logoutSuperAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SUPER_ADMIN_COOKIE_NAME)?.value;
    if (token && activeSessions[token]) {
      delete activeSessions[token];
    }
    cookieStore.delete(SUPER_ADMIN_COOKIE_NAME);
  } catch {}
}
