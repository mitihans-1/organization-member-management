import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, Plus, Download, MoreHorizontal } from 'lucide-react';

/** Org admins list — uses organAdmin users from members API pattern until dedicated endpoint exists */
const SuperAdminOrgAdmins: React.FC = () => {
  const [q, setQ] = useState('');
  const { data: users, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then((r) => r.data),
  });

  const admins = (users ?? []).filter((u: any) => u.role === 'organAdmin');
  const filtered = admins.filter(
    (u: any) =>
      !q.trim() ||
      (u.name && u.name.toLowerCase().includes(q.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Organization Admins</h1>
          <p className="text-sm text-slate-500">Manage all organization administrators on the platform</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-500"
          >
            <Plus size={18} />
            Add Admin
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search admins…"
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-bold text-slate-600">Name</th>
              <th className="text-left p-4 font-bold text-slate-600">Email</th>
              <th className="text-left p-4 font-bold text-slate-600">Organization</th>
              <th className="text-left p-4 font-bold text-slate-600">Role</th>
              <th className="w-12 p-4" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No organization admins found
                </td>
              </tr>
            ) : (
              filtered.map((u: any) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="p-4 font-medium text-slate-900">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4 text-slate-600">{u.organization_name ?? '—'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button type="button" className="p-1 rounded hover:bg-slate-200 text-slate-500">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminOrgAdmins;
