'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { toggleUserSuspensionAction } from '@/actions/super-admin';
import { Search, UserX, UserCheck, Shield, ShoppingBag, BookOpen } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SuperAdminUsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'seller' | 'admin'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const allUsers = store.getUsers();
  const purchases = store.getAllPurchases();
  const notes = store.getNotes();

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.university && u.university.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleSuspension = async (userId: string, currentlySuspended: boolean) => {
    setLoadingId(userId);
    await toggleUserSuspensionAction(userId, !currentlySuspended);
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">User Management</h1>
          <p className="text-xs text-slate-400">
            Inspect registered accounts, order activity, university credentials, and moderation status.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, email, or university..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-rose-500"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'student', 'seller', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                roleFilter === r
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">University &amp; Course</th>
                <th className="p-4">Purchases</th>
                <th className="p-4">Uploads</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredUsers.map((user) => {
                const userPurchases = purchases.filter((p) => p.buyer_id === user.id && p.status === 'paid');
                const userNotes = notes.filter((n) => n.seller_id === user.id);
                const isSuspended = (user.bio || '').includes('[ACCOUNT SUSPENDED]');

                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt={user.full_name}
                          className="w-8 h-8 rounded-full bg-slate-800 object-cover"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.full_name}</span>
                            {isSuspended && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950 text-rose-300 border border-rose-800">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'admin'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : user.role === 'seller'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>{user.university || 'Not Specified'}</div>
                      <span className="text-[10px] text-slate-500">{user.course || 'Undergraduate'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{userPurchases.length}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-slate-300">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>{userNotes.length}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-[11px]">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="p-4 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspension(user.id, isSuspended)}
                          disabled={loadingId === user.id}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ml-auto transition-colors ${
                            isSuspended
                              ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {isSuspended ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
