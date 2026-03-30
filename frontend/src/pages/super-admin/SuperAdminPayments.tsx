import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MoreVertical } from 'lucide-react';

const SuperAdminPayments: React.FC = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payments &amp; Subscriptions</h1>
        <p className="text-sm text-slate-500">Organization plans and payment activity</p>
      </div>

      <div className="flex border-b border-slate-200">
        <button type="button" className="px-4 py-2 text-sm font-bold text-sky-600 border-b-2 border-sky-600">
          Payment Transactions
        </button>
        <button type="button" className="px-4 py-2 text-sm font-medium text-slate-500">
          Invoices &amp; Receipts
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          placeholder="Search…"
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-bold text-slate-600">Plan</th>
              <th className="text-left p-3 font-bold text-slate-600">Amount</th>
              <th className="text-left p-3 font-bold text-slate-600">Billing</th>
              <th className="text-left p-3 font-bold text-slate-600">Member</th>
              <th className="w-10 p-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : !payments?.length ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((p: any) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{p.plan?.name ?? '—'}</td>
                  <td className="p-3">${p.amount ?? 0}</td>
                  <td className="p-3 text-slate-600">{p.plan?.billing_cycle ?? '—'}</td>
                  <td className="p-3 text-slate-600">{p.user?.name ?? p.user_id ?? '—'}</td>
                  <td className="p-3">
                    <button type="button" className="p-1 text-slate-400 hover:text-slate-600">
                      <MoreVertical size={18} />
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

export default SuperAdminPayments;
