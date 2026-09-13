import { redirect } from 'next/navigation';

export default function SellerWalletRedirect() {
  redirect('/dashboard/seller');
}
