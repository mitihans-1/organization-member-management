import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MemberSubscription, MemberSubscriptionPlan, User } from '../../types';
import { Users, Clock, CreditCard, Plus, X, UserPlus } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-rose-100 text-rose-800',
  expired: 'bg-slate-100 text-slate-700',
};

const OrgMemberSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.organizationId;

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    memberId: '',
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
  });

  useBodyScrollLock(isAssignOpen);

  const { data: subscriptions, isLoading } = useQuery<MemberSubscription[]>({
    queryKey: ['orgMemberSubscriptions', orgId],
    queryFn: () =>
      api.get(`/member-subscriptions/organizations/${orgId}`).then((r) => r.data),
    enabled: !!orgId,
  });

  const { data: members = [] } = useQuery<User[]>({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then((r) => r.data),
    enabled: !!orgId && isAssignOpen,
  });

  const { data: plans = [] } = useQuery<MemberSubscriptionPlan[]>({
    queryKey: ['orgSubscriptionPlans', orgId],
    queryFn: () =>
      api.get(`/member-subscription-plans/organizations/${orgId}`).then((r) => r.data),
    enabled: !!orgId && isAssignOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (data: { memberId: string; planId: string; startDate: string }) =>
      api.post(`/member-subscriptions/organizations/${orgId}/members/${data.memberId}`, {
        planId: data.planId,
        startDate: data.startDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMemberSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptions'] });
      setIsAssignOpen(false);
      setAssignForm({
        memberId: '',
        planId: '',
        startDate: new Date().toISOString().slice(0, 10),
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (subscriptionId: string) =>
      api.post(`/member-subscriptions/${subscriptionId}/cancel`, {
        reason: 'Cancelled by organization admin',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgMemberSubscriptions'] });
    },
  });

  const orgMembers = members.filter((m) => m.role === 'member');
  const activePlans = plans.filter((p) => p.isActive);
  const list = subscriptions ?? [];

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.memberId || !assignForm.planId) return;
    assignMutation.mutate(assignForm);
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Member Subscriptions</h2>
          <p className="text-slate-500 text-sm">
            View subscriptions and manually assign a plan to a member when needed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAssignOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition-colors"
        >
          <UserPlus size={18} />
          Assign plan to member
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-600 font-semibold">No member subscriptions yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Assign a plan manually or let members subscribe from their dashboard.
          </p>
          <button
            type="button"
            onClick={() => setIsAssignOpen(true)}
            className="mt-4 inline-flex items-center gap-2 text-sky-600 font-bold text-sm hover:underline"
          >
            <Plus size={16} />
            Assign first subscription
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Member</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Plan</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Started</th>
                <th className="px-4 py-3 text-left font-bold text-slate-600">Next billing</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">Price</th>
                <th className="px-4 py-3 text-right font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.map((sub) => {
                const memberName = sub.member?.name || sub.user?.name || 'Unknown member';
                const planName = sub.plan?.name || sub.planId;
                const status = sub.status || 'active';
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{memberName}</td>
                    <td className="px-4 py-3 text-slate-700">{planName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                          statusStyles[status] || statusStyles.active
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {sub.nextBillingDate
                        ? new Date(sub.nextBillingDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      <span className="inline-flex items-center justify-end gap-1">
                        <CreditCard size={14} className="text-slate-400" />
                        {sub.plan?.price != null
                          ? `${sub.plan.currency || 'ETB'} ${sub.plan.price.toLocaleString()}`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {status === 'active' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Cancel subscription for ${memberName}?`,
                              )
                            ) {
                              cancelMutation.mutate(sub.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign plan to member</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Creates an active subscription without member payment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Member
                </label>
                <select
                  required
                  value={assignForm.memberId}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, memberId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select member…</option>
                  {orgMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Subscription plan
                </label>
                <select
                  required
                  value={assignForm.planId}
                  onChange={(e) => setAssignForm((f) => ({ ...f, planId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select plan…</option>
                  {activePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.currency} {p.price} / {p.billingCycle}
                    </option>
                  ))}
                </select>
                {activePlans.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Create a plan under the Subscription Plans tab first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Start date
                </label>
                <input
                  type="date"
                  required
                  value={assignForm.startDate}
                  onChange={(e) =>
                    setAssignForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              {assignMutation.isError && (
                <p className="text-sm text-rose-600">
                  {(assignMutation.error as any)?.response?.data?.message ||
                    'Failed to assign plan.'}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    assignMutation.isPending ||
                    !assignForm.memberId ||
                    !assignForm.planId ||
                    activePlans.length === 0
                  }
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning…' : 'Assign plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgMemberSubscriptions;
