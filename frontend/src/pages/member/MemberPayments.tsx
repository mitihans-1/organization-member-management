import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Payment } from '../../types';
import { CreditCard } from 'lucide-react';

const MemberPayments: React.FC = () => {
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  return (
    <div className="max-w-3xl space-y-6 font-poppins">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payments</h1>
        <p className="text-sm text-slate-500">Your transactions and membership charges</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-3 font-bold text-slate-600">Plan</th>
              <th className="text-left p-3 font-bold text-slate-600">Amount</th>
              <th className="text-left p-3 font-bold text-slate-600">Status</th>
              <th className="text-left p-3 font-bold text-slate-600">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : !payments?.length ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-500">
                  <CreditCard className="mx-auto mb-2 text-slate-300" size={32} />
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium">{p.plan?.name ?? '—'}</td>
                  <td className="p-3">${p.amount ?? 0}</td>
                  <td className="p-3">
                    <span className="text-emerald-600 font-bold">{p.status ?? '—'}</span>
                  </td>
                  <td className="p-3 text-slate-600">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
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

export default MemberPayments;
