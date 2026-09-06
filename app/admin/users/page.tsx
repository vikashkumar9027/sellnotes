'use client';

import React, { useState } from 'react';
import { store } from '@/lib/store';
import { updateUserRoleAction } from '@/actions/admin';
import { Profile, UserRole } from '@/types';
import { Shield, User, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState(() => store.getUsers());
  const [query, setQuery] = useState('');

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRoleAction(userId, newRole);
    setUsers([...store.getUsers()]);
  };

  const filteredUsers = users.filter((u) =>
    u.full_name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase()) ||
    (u.university && u.university.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">User &amp; Role Management</h1>
          <p className="text-xs text-slate-500 font-medium">Manage student permissions, seller statuses, and admin role assignments.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="py-2 pl-9 pr-4 rounded-xl border text-xs bg-white dark:bg-slate-900 focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">University &amp; Course</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-extrabold text-slate-900 dark:text-white">{u.full_name}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">{u.university || 'N/A'}</div>
                    <div className="text-[11px] text-slate-400">{u.course}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="p-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="py-1 px-2 rounded-lg border text-xs bg-slate-50 dark:bg-slate-800 font-medium"
                    >
                      <option value="student">Student</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
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
