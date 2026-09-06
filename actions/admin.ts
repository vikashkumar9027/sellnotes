'use server';

import { store } from '@/lib/store';
import { NoteStatus, Profile, SystemSettings, WithdrawalStatus, Report } from '@/types';
import { revalidatePath } from 'next/cache';

export async function moderateNoteAction(noteId: string, status: NoteStatus, rejectionReason?: string) {
  try {
    const updated = store.updateNoteStatus(noteId, status, rejectionReason);
    revalidatePath('/admin/notes');
    revalidatePath('/notes');
    revalidatePath('/dashboard/seller/notes');
    return { success: true, note: updated };
  } catch {
    return { error: 'Failed to update note status' };
  }
}

export async function updateUserRoleAction(userId: string, newRole: Profile['role']) {
  try {
    const updated = store.updateUserRole(userId, newRole);
    revalidatePath('/admin/users');
    return { success: true, user: updated };
  } catch {
    return { error: 'Failed to update user role' };
  }
}

export async function processWithdrawalAction(withdrawalId: string, status: WithdrawalStatus, adminNote?: string) {
  try {
    const updated = store.updateWithdrawalStatus(withdrawalId, status, adminNote);
    revalidatePath('/admin/withdrawals');
    revalidatePath('/dashboard/seller/withdrawals');
    return { success: true, withdrawal: updated };
  } catch {
    return { error: 'Failed to update withdrawal status' };
  }
}

export async function createCategoryAction(name: string, description: string) {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
    const newCategory = store.addCategory({ name, slug, description });
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    return { success: true, category: newCategory };
  } catch {
    return { error: 'Failed to create category' };
  }
}

export async function resolveReportAction(reportId: string, status: Report['status'], adminResponse?: string) {
  try {
    const updated = store.resolveReport(reportId, status, adminResponse);
    revalidatePath('/admin/reports');
    return { success: true, report: updated };
  } catch {
    return { error: 'Failed to resolve report' };
  }
}

export async function updateSystemSettingsAction(newSettings: Partial<SystemSettings>) {
  try {
    const updated = store.updateSettings(newSettings);
    revalidatePath('/admin/settings');
    return { success: true, settings: updated };
  } catch {
    return { error: 'Failed to update settings' };
  }
}
