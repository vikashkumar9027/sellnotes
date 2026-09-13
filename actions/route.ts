'use server';

import { store } from '@/lib/store';
import { createRazorpayRouteAccount } from '@/lib/razorpay';
import { SellerAccount, SellerOnboardingStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function saveSellerPayoutAccountAction({
  sellerId,
  legalBusinessName,
  contactEmail,
  contactPhone,
  bankAccountNumber,
  bankIfsc,
  accountHolderName,
  upiVpa,
}: {
  sellerId: string;
  legalBusinessName: string;
  contactEmail: string;
  contactPhone?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  accountHolderName?: string;
  upiVpa?: string;
}) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('notemart_user_id')?.value;
    const effectiveSellerId = sellerId || sessionUserId;

    if (!effectiveSellerId) {
      return { error: 'Authentication required. Please log in as a seller.' };
    }

    if (!legalBusinessName || !contactEmail) {
      return { error: 'Legal name and email are required for payout account setup.' };
    }

    if (!upiVpa && (!bankAccountNumber || !bankIfsc)) {
      return { error: 'Please provide either a valid UPI ID or Bank Account Details.' };
    }

    const cleanEmail = contactEmail.trim().toLowerCase();
    const cleanName = legalBusinessName.trim();
    const cleanUpi = upiVpa ? upiVpa.trim().toLowerCase() : undefined;
    const cleanIfsc = bankIfsc ? bankIfsc.trim().toUpperCase() : undefined;

    // Mask sensitive bank account number: only store last 4 digits
    const last4 = bankAccountNumber ? bankAccountNumber.trim().slice(-4) : undefined;

    const settings = store.getSettings();
    let razorpayAccountId: string | undefined = undefined;
    let onboardingStatus: SellerOnboardingStatus = 'SUBMITTED';
    let kycStatus = 'PENDING';
    let routeNotice: string | undefined = undefined;

    // Attempt Razorpay Route linked account creation if Route is enabled
    if (settings.route_enabled) {
      const routeRes = await createRazorpayRouteAccount({
        name: cleanName,
        email: cleanEmail,
        phone: contactPhone,
        accountNumber: bankAccountNumber,
        ifsc: cleanIfsc,
      });

      if (routeRes.success && routeRes.accountId) {
        razorpayAccountId = routeRes.accountId;
        onboardingStatus = 'VERIFIED';
        kycStatus = 'VERIFIED';
      } else {
        console.warn('[ROUTE NOTICE]', routeRes.error);
        routeNotice = 'Razorpay Route activation is required on the merchant account for automated split transfers. Payout details have been saved for standard verification.';
        onboardingStatus = 'SUBMITTED';
      }
    } else {
      // Local/Standard verification mode when Route is disabled or pending merchant activation
      onboardingStatus = 'VERIFIED';
      kycStatus = 'VERIFIED';
    }

    const existingAccount = store.getSellerAccount(effectiveSellerId);
    const updatedAccount: SellerAccount = {
      id: existingAccount?.id || `sa_${effectiveSellerId}`,
      seller_id: effectiveSellerId,
      razorpay_account_id: razorpayAccountId || existingAccount?.razorpay_account_id,
      legal_business_name: cleanName,
      business_type: 'individual',
      contact_email: cleanEmail,
      contact_phone: contactPhone?.trim() || existingAccount?.contact_phone,
      bank_account_number_last4: last4 || existingAccount?.bank_account_number_last4,
      bank_ifsc: cleanIfsc || existingAccount?.bank_ifsc,
      account_holder_name: (accountHolderName || cleanName).trim(),
      upi_vpa: cleanUpi || existingAccount?.upi_vpa,
      onboarding_status: onboardingStatus,
      kyc_status: kycStatus,
      bank_status: (last4 || cleanUpi) ? 'LINKED' : 'NOT_LINKED',
      created_at: existingAccount?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    store.saveSellerAccount(updatedAccount);

    revalidatePath('/dashboard/seller');
    revalidatePath('/dashboard/seller/payout-setup');
    revalidatePath('/dashboard/seller/withdrawals');
    revalidatePath('/super-admin/sellers');

    return {
      success: true,
      account: {
        ...updatedAccount,
        bank_account_number_last4: last4 ? `••••••••${last4}` : undefined,
      },
      notice: routeNotice,
      message: 'Payout account details updated successfully!',
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to save payout account';
    return { error: errorMessage };
  }
}

export async function getSellerPayoutAccountAction(sellerId: string) {
  try {
    const account = store.getSellerAccount(sellerId);
    if (!account) return { success: false, account: null };

    return {
      success: true,
      account: {
        ...account,
        bank_account_number_last4: account.bank_account_number_last4
          ? `••••••••${account.bank_account_number_last4}`
          : undefined,
      },
    };
  } catch {
    return { success: false, error: 'Could not fetch seller payout account' };
  }
}
