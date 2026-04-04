import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plan } from '../types';
import { CheckCircle, Plus, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const Payments: React.FC = () => {
  const { user } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  useBodyScrollLock(isUpgradeModalOpen);

  const { data: payments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((res) => res.data),
  });

  const { data: plans, isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((res) => res.data),
  });

  const filtered = useMemo(() => {
    const list = payments ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const planName = p.plan?.name?.toLowerCase() ?? '';
      const method = p.payment_method?.toLowerCase() ?? '';
      const tid = p.transaction_id?.toLowerCase() ?? '';
      return planName.includes(q) || method.includes(q) || tid.includes(q);
    });
  }, [payments, searchTerm]);

  const upgradeMutation = useMutation({
    mutationFn: (planId: number) =>
      api.post('/payments', {
        plan_id: planId,
        amount: plans?.find((p) => p.id === planId)?.price || 0,
        payment_method: 'Credit Card',
        transaction_id: 'TRX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      setIsUpgradeModalOpen(false);
      alert('Plan upgraded successfully!');
    },
  });

  return (
    <div className="space-y-6 font-poppins">
      <OrgAdminPageHeader
        title="Payments"
        subtitle="View subscription charges and payment history"
        actions={
          user?.role === 'orgAdmin' ? (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus size={18} />
              Upgrade Plan
            </button>
          ) : undefined
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="search"
          placeholder="Search by plan, method, or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Payment history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                {user?.role === 'SuperAdmin' && <th className="px-4 py-3">Organization</th>}
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentsLoading ? (
                <tr>
                  <td
                    colSpan={user?.role === 'SuperAdmin' ? 7 : 6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading payments...
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td
                    colSpan={user?.role === 'SuperAdmin' ? 7 : 6}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No payment history found
                  </td>
                </tr>
              ) : (
                filtered?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50/80">
                    {user?.role === 'SuperAdmin' && (
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {payment.user?.organization_name || payment.user?.name}
                      </td>
                    )}
                    <td className="px-4 py-4 font-bold text-gray-900">{payment.plan?.name}</td>
                    <td className="px-4 py-4 text-gray-800 font-semibold">
                      ETB {Number(payment.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{payment.payment_method}</td>
                    <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                      {new Date(payment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                        <CheckCircle size={12} />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[10px] font-mono text-gray-400 uppercase">
                      {payment.transaction_id}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-black text-gray-900">Choose Your Plan</h3>
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              {plansLoading ? (
                <div className="text-center py-16 text-gray-400">Loading available plans...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {plans?.map((plan) => (
                    <div
                      key={plan.id}
                      className="border-2 border-gray-100 rounded-2xl p-8 flex flex-col hover:border-indigo-200 hover:shadow-lg transition-all"
                    >
                      <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-widest">
                        {plan.name}
                      </h4>
                      <div className="mb-6">
                        <span className="text-4xl font-black text-gray-900">ETB {plan.price}</span>
                        <span className="text-gray-500 font-semibold"> / {plan.billing_cycle}</span>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                          Up to {plan.max_members} members
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-indigo-600 shrink-0" />
                          {plan.duration_days} days access
                        </li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => upgradeMutation.mutate(plan.id)}
                        disabled={upgradeMutation.isPending}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                      >
                        {upgradeMutation.isPending ? 'Processing...' : 'Get Started'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
