'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import { ScrollText, Search, ShieldCheck, AlertCircle } from 'lucide-react';

export default function SuperAdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const auditLogs = store.getAuditLogs();

  const filteredLogs = auditLogs.filter((log) => {
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.admin_id.toLowerCase().includes(search.toLowerCase()) ||
      (log.target && log.target.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">System Audit Trail</h1>
          <p className="text-xs text-slate-400">
            Immutable log of all administrative actions, setting changes, withdrawal reviews, and security events.
          </p>
        </div>
      </div>

      {/* SEARCH FILTER */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by action (e.g. WITHDRAWAL, SETTING, LOGIN)..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
        />
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin ID</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target Resource</th>
                <th className="p-4">Result</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 text-slate-400 text-[11px] whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="p-4 font-bold text-white">
                    {log.admin_id}
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-bold border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">
                    {log.target || 'General System'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      log.result === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {log.result}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[11px] text-slate-400">
                    {log.ip_address || 'Internal'}
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
