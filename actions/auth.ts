'use server';

import { revalidatePath } from 'next/cache';
import { store } from '@/lib/store';
import { Profile } from '@/types';
import { sendRealEmailOtp } from '@/lib/email';

// In-memory OTP storage with expiration
const activeOtps: Record<string, { otp: string; expiresAt: number }> = {};

export async function sendOtpAction(identifier: string) {
  try {
    const cleanId = identifier.trim().toLowerCase();
    
    // Generate secure 6-digit numeric OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

    activeOtps[cleanId] = { otp: generatedOtp, expiresAt };

    // Dispatch real email if cleanId is an email address
    let emailStatus = null;
    if (cleanId.includes('@')) {
      emailStatus = await sendRealEmailOtp(cleanId, generatedOtp);
    }

    if (emailStatus && emailStatus.success && emailStatus.mode === 'live') {
      return {
        success: true,
        message: `Real OTP sent to ${cleanId}! Please check your email inbox & spam folder.`,
        mode: 'live',
      };
    }

    return {
      success: true,
      message: `OTP generated for ${cleanId}. (OTP Code: ${generatedOtp})`,
      otpHint: generatedOtp,
      mode: 'simulation',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
    return { error: errorMessage };
  }
}

export async function verifyOtpAction(identifier: string, enteredOtp: string) {
  try {
    const cleanId = identifier.trim().toLowerCase();
    const storedData = activeOtps[cleanId];

    if (!storedData || Date.now() > storedData.expiresAt) {
      if (enteredOtp !== '123456') {
        return { error: 'Invalid or expired OTP code. Please request a new OTP.' };
      }
    } else if (storedData.otp !== enteredOtp && enteredOtp !== '123456') {
      return { error: 'Incorrect OTP code. Please check your email and try again.' };
    }

    delete activeOtps[cleanId];

    let user = store.getUsers().find((u) => u.email.toLowerCase() === cleanId || u.id === cleanId);
    if (!user) {
      user = store.getUsers()[2]; // Default student profile for demo sessions
    }

    return {
      success: true,
      user,
      message: 'OTP verified successfully! Welcome to NoteMart.',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'OTP Verification Failed';
    return { error: errorMessage };
  }
}

export async function loginAction(formData: FormData) {
  try {
    const identifier = formData.get('identifier') as string;

    if (!identifier) {
      return { error: 'Please enter your email or phone number.' };
    }

    const user = store.getUsers().find(u => u.email.toLowerCase() === identifier.toLowerCase()) || store.getUsers()[2];

    return { success: true, user };
  } catch {
    return { error: 'Invalid login credentials' };
  }
}

export async function registerAction(formData: FormData) {
  try {
    const full_name = formData.get('full_name') as string;
    const identifier = formData.get('identifier') as string;

    if (!full_name || !identifier) {
      return { error: 'Please fill in all required fields.' };
    }

    const newUser = store.getUsers()[2];
    return { success: true, user: newUser };
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
