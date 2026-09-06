'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { resolveReportAction } from '@/actions/admin';
import { formatDate } from '@/lib/utils';
import { Flag, CheckCircle2 } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState(() => store.getReports());

  const handleResolve = async (id: string, status: 'reviewed' | 'dismissed' | 'actioned') => {
    await resolveReportAction(id, status, 'Reviewed by moderation team');
    setReports([...store.getReports()]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Copyright &amp; Quality Reports</h1>
        <p className="text-xs text-slate-500 font-medium">Investigate user-flagged content for potential copyright infringement or misleading information.</p>
      </div>

      <div className="space-y-4">
        {reports.map((r) => (
          <div key={r.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase">
                <Flag className="w-4 h-4" /> Reason: {r.reason}
              </div>
              <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
            </div>

            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Note: {r.note?.title}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              &quot;{r.description}&quot;
            </p>
            <p className="text-[11px] text-slate-400">Reported by: {r.reporter?.full_name}</p>

            <div className="pt-2 flex gap-2 justify-end">
              {r.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleResolve(r.id, 'dismissed')}
                    className="py-1.5 px-4 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Dismiss Flag
                  </button>
                  <button
                    onClick={() => handleResolve(r.id, 'actioned')}
                    className="py-1.5 px-4 rounded-xl text-xs font-bold bg-rose-600 text-white"
                  >
                    Take Down Note
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
