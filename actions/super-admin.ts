'use server';

import { requireSuperAdmin, authenticateSuperAdmin, logoutSuperAdmin } from '@/lib/super-admin-auth';
import { store } from '@/lib/store';
import { WalletLedgerService } from '@/lib/wallet';
import { SystemSettings, NoteStatus, SellerOnboardingStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function superAdminLoginAction(formData: FormData) {
  try {
    const email = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';

    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    const result = await authenticateSuperAdmin(email, password, ip);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return { success: false, error: message };
  }
}

export async function superAdminLogoutAction() {
  await logoutSuperAdmin();
  return { success: true };
}

export async function reviewWithdrawalAction({
  withdrawalId,
  decision,
  adminNote,
}: {
  withdrawalId: string;
  decision: 'APPROVE' | 'REJECT' | 'REVERSE';
  adminNote?: string;
}) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized. Super Admin session required.' };
  }

  try {
    const withdrawal = store.getWithdrawalRequests().find((w) => w.id === withdrawalId);
    if (!withdrawal) {
      return { error: 'Withdrawal request not found' };
    }

    if (decision === 'APPROVE') {
      store.updateWithdrawalRequest(withdrawalId, {
        status: 'SUCCESS',
        processed_at: new Date().toISOString(),
        admin_note: adminNote || 'Approved by Super Admin',
      });

      // Update legacy withdrawal table
      store.updateWithdrawalStatus(withdrawalId, 'completed', adminNote);

      store.recordAuditLog({
        admin_id: auth.email || 'super-admin',
        action: 'WITHDRAWAL_APPROVED',
        target: `Withdrawal ${withdrawalId} (Seller: ${withdrawal.seller_id})`,
        result: 'SUCCESS',
        metadata: { amount_paise: withdrawal.amount_paise, note: adminNote },
      });

      revalidatePath('/super-admin/withdrawals');
      revalidatePath('/super-admin/dashboard');
      revalidatePath('/dashboard/seller/withdrawals');
      return { success: true, message: 'Withdrawal marked as successfully paid.' };
    }

    // Decision is REJECT or REVERSE: Restore seller wallet balance via immutable reversal transaction
    const reversalTx = WalletLedgerService.reverseWithdrawal({
      sellerId: withdrawal.seller_id,
      withdrawalId,
      reason: adminNote || 'Declined by Administrator',
    });

    store.updateWithdrawalRequest(withdrawalId, {
      status: decision === 'REJECT' ? 'FAILED' : 'REVERSED',
      failure_reason: adminNote || 'Declined by Administrator',
      admin_note: adminNote,
      processed_at: new Date().toISOString(),
    });

    // Update legacy withdrawal table
    store.updateWithdrawalStatus(withdrawalId, 'rejected', adminNote);

    store.recordAuditLog({
      admin_id: auth.email || 'super-admin',
      action: decision === 'REJECT' ? 'WITHDRAWAL_REJECTED' : 'WITHDRAWAL_REVERSED',
      target: `Withdrawal ${withdrawalId} (Seller: ${withdrawal.seller_id})`,
      result: 'SUCCESS',
      metadata: {
        amount_paise: withdrawal.amount_paise,
        reversal_tx_id: reversalTx.id,
        note: adminNote,
      },
    });

    revalidatePath('/super-admin/withdrawals');
    revalidatePath('/super-admin/ledger');
    revalidatePath('/super-admin/dashboard');
    revalidatePath('/dashboard/seller/withdrawals');
    revalidatePath('/dashboard/seller/wallet');

    return {
      success: true,
      message: `Withdrawal ${decision.toLowerCase()}ed. Exact funds restored to seller available balance via immutable reversal transaction.`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update withdrawal';
    return { error: message };
  }
}

export async function updateAdminSettingsAction(newSettings: Partial<SystemSettings>) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized. Super Admin session required.' };
  }

  try {
    // Validate commission range: 0% to 100%
    if (newSettings.platform_commission !== undefined) {
      if (newSettings.platform_commission < 0 || newSettings.platform_commission > 100) {
        return { error: 'Platform commission must be between 0% and 100%' };
      }
    }

    if (newSettings.min_withdrawal_amount !== undefined && newSettings.min_withdrawal_amount < 1) {
      return { error: 'Minimum withdrawal amount must be at least ₹1' };
    }

    const updated = store.updateSettings(newSettings);

    store.recordAuditLog({
      admin_id: auth.email || 'super-admin',
      action: 'SETTING_CHANGED',
      target: 'Platform Settings',
      result: 'SUCCESS',
      metadata: newSettings,
    });

    revalidatePath('/super-admin/settings');
    revalidatePath('/admin/settings');
    revalidatePath('/notes');
    return { success: true, settings: updated };
  } catch {
    return { error: 'Failed to update platform settings' };
  }
}

export async function toggleUserSuspensionAction(userId: string, isSuspended: boolean) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized. Super Admin session required.' };
  }

  try {
    const user = store.getUserById(userId);
    if (!user) return { error: 'User not found' };

    // Update bio or flag to indicate suspension
    const updatedBio = isSuspended ? `[ACCOUNT SUSPENDED] ${user.bio || ''}` : (user.bio || '').replace('[ACCOUNT SUSPENDED]', '').trim();
    store.updateUserProfile(userId, { bio: updatedBio });

    store.recordAuditLog({
      admin_id: auth.email || 'super-admin',
      action: isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      target: `User ${userId} (${user.email})`,
      result: 'SUCCESS',
    });

    revalidatePath('/super-admin/users');
    revalidatePath('/super-admin/dashboard');
    return { success: true };
  } catch {
    return { error: 'Failed to toggle user status' };
  }
}

export async function updateSellerOnboardingStatusAction(
  sellerId: string,
  newStatus: SellerOnboardingStatus
) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized. Super Admin session required.' };
  }

  try {
    const account = store.getSellerAccount(sellerId);
    if (!account) return { error: 'Seller payout account not found' };

    account.onboarding_status = newStatus;
    account.updated_at = new Date().toISOString();
    store.saveSellerAccount(account);

    store.recordAuditLog({
      admin_id: auth.email || 'super-admin',
      action: 'SELLER_STATUS_CHANGED',
      target: `Seller ${sellerId} (${account.legal_business_name})`,
      result: 'SUCCESS',
      metadata: { new_status: newStatus },
    });

    revalidatePath('/super-admin/sellers');
    revalidatePath('/super-admin/dashboard');
    return { success: true, account };
  } catch {
    return { error: 'Failed to update seller onboarding status' };
  }
}

export async function moderateNoteSuperAdminAction(
  noteId: string,
  status: NoteStatus,
  rejectionReason?: string
) {
  const auth = await requireSuperAdmin();
  if (!auth.authorized) {
    return { error: 'Unauthorized. Super Admin session required.' };
  }

  try {
    const note = store.updateNoteStatus(noteId, status, rejectionReason);

    store.recordAuditLog({
      admin_id: auth.email || 'super-admin',
      action: 'NOTE_MODERATED',
      target: `Note ${noteId} (${note?.title || 'Unknown'})`,
      result: 'SUCCESS',
      metadata: { status, rejectionReason },
    });

    revalidatePath('/super-admin/notes');
    revalidatePath('/super-admin/dashboard');
    revalidatePath('/notes');
    return { success: true, note };
  } catch {
    return { error: 'Failed to update note status' };
  }
}
