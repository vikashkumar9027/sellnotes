'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { updateAdminSettingsAction } from '@/actions/super-admin';
import { Settings, Save, CheckCircle2, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';

export default function SuperAdminSettingsPage() {
  const currentSettings = store.getSettings();

  const [platformCommission, setPlatformCommission] = useState(currentSettings.platform_commission ?? 25);
  const [minWithdrawal, setMinWithdrawal] = useState(currentSettings.min_withdrawal_amount ?? 100);
  const [routeEnabled, setRouteEnabled] = useState(Boolean(currentSettings.route_enabled));
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(currentSettings.withdrawal_enabled !== false);
  const [autoApproval, setAutoApproval] = useState(Boolean(currentSettings.auto_approval));
  const [sellerRegistration, setSellerRegistration] = useState(currentSettings.seller_registration_enabled !== false);
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(currentSettings.maintenance_mode));
  const [settlementDelay, setSettlementDelay] = useState(currentSettings.settlement_delay_days ?? 0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const res = await updateAdminSettingsAction({
      platform_commission: Number(platformCommission),
      min_withdrawal_amount: Number(minWithdrawal),
      route_enabled: routeEnabled,
      withdrawal_enabled: withdrawalEnabled,
      auto_approval: autoApproval,
      seller_registration_enabled: sellerRegistration,
      maintenance_mode: maintenanceMode,
      settlement_delay_days: Number(settlementDelay),
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      setMessage('Platform settings updated and validated successfully!');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Platform Settings &amp; Financial Governance</h1>
        <p className="text-xs text-slate-400">
          Configure default platform commission percentages, seller withdrawal rules, Razorpay Route features, and marketplace operational modes.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* FINANCIAL CONFIGURATION */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider text-rose-400">
            Financial &amp; Revenue Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Platform Commission (%) *
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={platformCommission}
                onChange={(e) => setPlatformCommission(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-hidden focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500">
                Default: 25%. Seller receives remaining {100 - platformCommission}% net revenue.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Minimum Withdrawal Amount (₹) *
              </label>
              <input
                type="number"
                min={1}
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(Number(e.target.value))}
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-hidden focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500">
                Minimum balance required for a seller to submit a payout request.
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Settlement Delay (Days)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={settlementDelay}
                onChange={(e) => setSettlementDelay(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:outline-hidden focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500">
                Number of days earnings remain in pending balance before moving to available. (0 = Instant)
              </span>
            </div>
          </div>
        </div>

        {/* RAZORPAY ROUTE SETTINGS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider text-rose-400">
            Razorpay Route Integration
          </h2>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Enable Razorpay Route Split Transfers</span>
              <p className="text-[11px] text-slate-400">
                Automatically split customer payments and transfer seller share directly to verified linked accounts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={routeEnabled}
              onChange={(e) => setRouteEnabled(e.target.checked)}
              className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
            />
          </div>

          {!routeEnabled && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Razorpay Route activation is required before seller payouts can go live. Standard manual review mode active.</span>
            </div>
          )}
        </div>

        {/* MARKETPLACE TOGGLES */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider text-rose-400">
            Operational Controls
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Withdrawals Enabled</span>
                <span className="text-[11px] text-slate-400">Allow sellers to submit withdrawal payout requests</span>
              </div>
              <input
                type="checkbox"
                checked={withdrawalEnabled}
                onChange={(e) => setWithdrawalEnabled(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Automatic Note Approval</span>
                <span className="text-[11px] text-slate-400">Instantly publish newly uploaded notes without admin review</span>
              </div>
              <input
                type="checkbox"
                checked={autoApproval}
                onChange={(e) => setAutoApproval(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Seller Registration</span>
                <span className="text-[11px] text-slate-400">Allow new users to register and upload study notes</span>
              </div>
              <input
                type="checkbox"
                checked={sellerRegistration}
                onChange={(e) => setSellerRegistration(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-white block">Maintenance Mode</span>
                <span className="text-[11px] text-slate-400">Pause public browsing while conducting maintenance</span>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Platform Settings</span>
        </button>
      </form>
    </div>
  );
}
