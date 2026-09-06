'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { updateSystemSettingsAction } from '@/actions/admin';
import { Settings, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function AdminSettingsPage() {
  const currentSettings = store.getSettings();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [commission, setCommission] = useState(currentSettings.platform_commission ?? 20);
  const [gstRate, setGstRate] = useState(currentSettings.gst_rate ?? 18);
  const [minPrice, setMinPrice] = useState(currentSettings.min_note_price ?? 0);
  const [maxPrice, setMaxPrice] = useState(currentSettings.max_note_price ?? 2000);
  const [minWithdrawal, setMinWithdrawal] = useState(currentSettings.min_withdrawal_amount ?? 100);
  const [maxPdfSize, setMaxPdfSize] = useState(currentSettings.max_pdf_size_mb ?? 2048);
  const [autoApproval, setAutoApproval] = useState(currentSettings.auto_approval ?? true);
  const [maintenance, setMaintenance] = useState(currentSettings.maintenance_mode ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    await updateSystemSettingsAction({
      platform_commission: commission,
      gst_rate: gstRate,
      min_note_price: minPrice,
      max_note_price: maxPrice,
      min_withdrawal_amount: minWithdrawal,
      max_pdf_size_mb: maxPdfSize,
      auto_approval: autoApproval,
      maintenance_mode: maintenance,
    });

    setLoading(false);
    setSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Platform System Settings</h1>
        <p className="text-xs text-slate-500 font-medium">Configure global commission rates, GST percentage, pricing limits, file size caps, and auto approval rules.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Platform settings updated successfully! New rates apply to future transactions.</span>
          </div>
        )}

        {/* GST & COMMISSION CONFIGURATION */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-4">
          <h3 className="font-extrabold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-600" /> GST Tax &amp; Commission Rates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="text-slate-700 dark:text-slate-300">GST Rate (%) *</label>
              <input
                type="number"
                step="0.01"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
              />
              <span className="text-[10px] font-normal text-slate-500 mt-0.5 block">Added to buyer base price at checkout (Default: 18%)</span>
            </div>

            <div>
              <label className="text-slate-700 dark:text-slate-300">Platform Commission (%) *</label>
              <input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                required
                className="w-full py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
              />
              <span className="text-[10px] font-normal text-slate-500 mt-0.5 block">Deducted from seller base earning (Default: 20%)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              <strong>Historical Rate Audit Protection:</strong> Updating these rates updates future transaction calculations. Every completed purchase permanently records the exact rates applied at the time of order.
            </span>
          </div>
        </div>

        {/* PRICING & FILE LIMITS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="text-slate-700 dark:text-slate-300">Minimum Note Price (₹) *</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value))}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border mt-1"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300">Maximum Note Price (₹) *</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border mt-1"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300">Minimum Withdrawal Amount (₹) *</label>
            <input
              type="number"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(Number(e.target.value))}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border mt-1"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300">Max PDF Size Limit (MB) *</label>
            <input
              type="number"
              value={maxPdfSize}
              onChange={(e) => setMaxPdfSize(Number(e.target.value))}
              required
              className="w-full py-2.5 px-3.5 rounded-xl border mt-1"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoApproval}
              onChange={(e) => setAutoApproval(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-sm"
            />
            <span className="text-xs font-bold text-slate-900 dark:text-white">Enable Auto Approval for Uploaded Notes</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded-sm"
            />
            <span className="text-xs font-bold text-rose-600">Enable Maintenance Mode</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save System Settings'}
        </button>
      </form>
    </div>
  );
}
