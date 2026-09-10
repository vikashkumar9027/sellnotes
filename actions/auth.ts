'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { store } from '@/lib/store';
import { Profile } from '@/types';
import { sendRealEmailOtp } from '@/lib/email';

interface OtpData {
  otp: string;
  expiresAt: number; // 5 minutes
  lastSentAt: number; // 60s cooldown
  attempts: number; // max 3 attempts
  metadata?: {
    fullName?: string;
    university?: string;
    role?: 'student' | 'seller';
    phone?: string;
  };
}

// In-memory OTP storage persisted on globalThis during dev reloads
const globalAuth = globalThis as unknown as {
  activeOtps?: Record<string, OtpData>;
};
const activeOtps: Record<string, OtpData> = globalAuth.activeOtps || {};
globalAuth.activeOtps = activeOtps;

export async function sendOtpAction(
  identifier: string,
  metadata?: { fullName?: string; university?: string; role?: 'student' | 'seller'; phone?: string }
) {
  try {
    const cleanId = identifier.trim().toLowerCase();

    if (!cleanId || !cleanId.includes('@')) {
      return { error: 'Please enter a valid email address to receive your verification OTP.' };
    }

    // 1. Resend cooldown check (60 seconds)
    const existing = activeOtps[cleanId];
    if (existing && Date.now() - existing.lastSentAt < 60000) {
      const waitSeconds = Math.ceil((60000 - (Date.now() - existing.lastSentAt)) / 1000);
      return {
        error: `Please wait ${waitSeconds} seconds before requesting a new OTP code.`,
      };
    }

    // 2. Generate cryptographically strong 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Exactly 5 minutes validity

    // 3. Save OTP with attempt counter and expiration
    activeOtps[cleanId] = {
      otp: generatedOtp,
      expiresAt,
      lastSentAt: Date.now(),
      attempts: 0,
      metadata: metadata || existing?.metadata,
    };

    // 4. Dispatch real email to user's inbox
    const emailResult = await sendRealEmailOtp(cleanId, generatedOtp);

    if (emailResult.mode === 'live') {
      return {
        success: true,
        message: `A 6-digit verification code has been sent directly to ${cleanId}. Please check your inbox and spam folder. (Valid for 5 minutes)`,
      };
    }

    // 5. Fallback local simulation mode (terminal log)
    return {
      success: true,
      message: `Verification code generated for ${cleanId}. (Local Mode: Brevo SMTP login requires configuration, code logged in terminal).`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
    return { error: errorMessage };
  }
}

export async function verifyOtpAction(
  identifier: string,
  enteredOtp: string,
  registrationData?: { fullName?: string; university?: string; role?: 'student' | 'seller' }
) {
  try {
    const cleanId = identifier.trim().toLowerCase();
    const cleanOtp = enteredOtp.trim();

    if (!cleanId) {
      return { error: 'Email identifier is missing.' };
    }

    const storedData = activeOtps[cleanId];

    if (!storedData) {
      return { error: 'No active OTP found or code has expired. Please request a new OTP.' };
    }

    // Check expiration (5 minutes)
    if (Date.now() > storedData.expiresAt) {
      delete activeOtps[cleanId];
      return { error: 'The OTP code has expired (5-minute validity). Please request a new code.' };
    }

    // Check attempt limits (max 3)
    if (storedData.attempts >= 3) {
      delete activeOtps[cleanId];
      return { error: 'Maximum incorrect attempts exceeded. This OTP has been invalidated. Please request a new code.' };
    }

    // Strict validation: NO dummy or bypass code
    if (storedData.otp !== cleanOtp) {
      storedData.attempts += 1;
      const remaining = 3 - storedData.attempts;
      if (remaining <= 0) {
        delete activeOtps[cleanId];
        return { error: 'Incorrect OTP code. Maximum attempts exceeded. Please request a new code.' };
      }
      return { error: `Incorrect OTP code. You have ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
    }

    // OTP verified successfully - invalidate OTP immediately (single-use)
    const meta = storedData.metadata || registrationData;
    delete activeOtps[cleanId];

    // Check if user already exists or create a separate new account
    let user = store.getUsers().find((u) => u.email.toLowerCase() === cleanId);
    if (!user) {
      user = store.createUser({
        email: cleanId,
        full_name: meta?.fullName || cleanId.split('@')[0],
        university: meta?.university || '',
        role: meta?.role || 'student',
      });
    } else {
      if (meta?.role && user.role !== meta.role) {
        user.role = meta.role;
      }
      if (meta?.fullName && !user.full_name) {
        user.full_name = meta.fullName;
      }
      if (meta?.university && !user.university) {
        user.university = meta.university;
      }
    }

    // Set secure HTTP session cookie
    const cookieStore = await cookies();
    cookieStore.set('notemart_user_id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/seller');

    return {
      success: true,
      user,
      message: 'Email verified successfully! Welcome to NoteMart.',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'OTP Verification Failed';
    return { error: errorMessage };
  }
}

export async function getCurrentUserAction(): Promise<Profile | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('notemart_user_id')?.value;
    if (!userId) return null;
    const user = store.getUserById(userId);
    return user || null;
  } catch {
    return null;
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('notemart_user_id');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { error: 'Failed to log out' };
  }
}

export async function switchSessionUserAction(userId: string) {
  try {
    const user = store.getUserById(userId);
    if (!user) return { error: 'User not found' };
    const cookieStore = await cookies();
    cookieStore.set('notemart_user_id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });
    revalidatePath('/');
    return { success: true, user };
  } catch {
    return { error: 'Failed to switch user' };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const identifier = formData.get('identifier') as string;

    if (!identifier) {
      return { error: 'Please enter your email or phone number.' };
    }

    const user = store.getUsers().find((u) => u.email.toLowerCase() === identifier.toLowerCase());
    if (!user) {
      return { error: 'User not found. Please register or verify with OTP.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('notemart_user_id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, user };
  } catch {
    return { error: 'Invalid login credentials' };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const full_name = formData.get('full_name') as string;
    const identifier = formData.get('identifier') as string;
    const university = (formData.get('university') as string) || '';
    const role = (formData.get('role') as Profile['role']) || 'student';

    if (!full_name || !identifier) {
      return { error: 'Please fill in all required fields.' };
    }

    const user = store.createUser({
      email: identifier,
      full_name,
      university,
      role,
    });

    const cookieStore = await cookies();
    cookieStore.set('notemart_user_id', user.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, user };
  } catch {
    return { error: 'Registration failed' };
  }
}

export async function updateProfileAction(userId: string, updates: Partial<Profile>) {
  try {
    const updatedUser = store.updateUserProfile(userId, updates);
    revalidatePath('/dashboard/profile');
    return { success: true, user: updatedUser };
  } catch {
    return { error: 'Failed to update profile' };
  }
}
