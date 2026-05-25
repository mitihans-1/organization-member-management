
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Eye, Pause, Play, XCircle, CheckCircle, Calendar } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MemberSubscription, MemberSubscriptionPlan, Member } from '../../types';

const OrgMemberSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const { data: members, isLoading: loadingMembers } = useQuery<Member[]>({
    queryKey: ['orgMembers'],
    queryFn: () => api.get('/members').then((r) => r.data),
  });

  const { data: plans, isLoading: loadingPlans } = useQuery<MemberSubscriptionPlan[]>({
    queryKey: ['orgSubscriptionPlans'],
    queryFn: () =>
      api.get(`/member-subscription-plans/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery<MemberSubscription[]>({
    queryKey: ['orgSubscriptions'],
    queryFn: () =>
      api.get(`/member-subscriptions/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: (data: any) =>
      api.post(
        `/member-subscriptions/organizations/${user?.organizationId}/members/${selectedMember?.id}/subscriptions`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptions'] });
      setIsModalOpen(false);
      setSelectedMember(null);
      setSelectedPlan('');
    },
  });

  const pauseSubscriptionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/member-subscriptions/subscriptions/${id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptions'] });
    },
  });

  const resumeSubscriptionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/member-subscriptions/subscriptions/${id}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptions'] });
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: (id: string) => api.post(`/member-subscriptions/subscriptions/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptions'] });
    },
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'paused':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      case 'expired':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-slate-900">Member Subscriptions</h2>
          <p className="text-slate-500 text-sm">
            Members should primarily self-subscribe via their dashboard. Use manual assignment only for special cases.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition"
        >
          <Plus size={18} />
          Manual Assign (Special Case)
        </button>
      </div>

      {loadingSubscriptions || loadingMembers || loadingPlans ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : subscriptions?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-lg">No member subscriptions yet. Members can self-subscribe via their dashboard!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600">Member</th>
                  <th className="text-left p-4 font-bold text-slate-600">Plan</th>
                  <th className="text-left p-4 font-bold text-slate-600">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600">Start Date</th>
                  <th className="text-left p-4 font-bold text-slate-600">Next Billing</th>
                  <th className="text-left p-4 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions?.map((sub) => (
                  <tr key={sub.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{sub.member?.name}</div>
                      <div className="text-xs text-slate-500">{sub.member?.email}</div>
                    </td>
                    <td className="p-4 font-medium text-slate-700">{sub.plan?.name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadgeClass(
                          sub.status
                        )}`}
                      >
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-600">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => pauseSubscriptionMutation.mutate(sub.id)}
                            className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition"
                            title="Pause"
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        {sub.status === 'paused' && (
                          <button
                            onClick={() => resumeSubscriptionMutation.mutate(sub.id)}
                            className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition"
                            title="Resume"
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {sub.status === 'active' && (
                          <button
                            onClick={() => cancelSubscriptionMutation.mutate(sub.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Assign Subscription</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedMember && selectedPlan) {
                  const plan = plans?.find(p => p.id === selectedPlan);
                  const trialEndsAt = plan?.trialDays
                    ? new Date(new Date(startDate).getTime() + plan.trialDays * 24 * 60 * 60 * 1000).toISOString()
                    : undefined;

                  createSubscriptionMutation.mutate({
                    planId: selectedPlan,
                    startDate,
                    trialEndsAt,
                  });
                }
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Member</label>
                <select
                  required
                  value={selectedMember?.id || ''}
                  onChange={(e) => {
                    const member = members?.find((m) => m.id === e.target.value);
                    setSelectedMember(member || null);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                >
                  <option value="">Select a member</option>
                  {members?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Plan</label>
                <select
                  required
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                >
                  <option value="">Select a plan</option>
                  {plans?.filter((p) => p.isActive).map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.currency} {plan.price.toLocaleString()}/{plan.billingCycle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-12 pr-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                    />
                  </div>
                </div>
                {selectedPlan && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Trial Ends At</label>
                    <input
                      type="date"
                      disabled
                      value={
                        selectedPlan && plans?.find(p => p.id === selectedPlan)?.trialDays
                          ? new Date(new Date(startDate).getTime() + plans?.find(p => p.id === selectedPlan)!.trialDays! * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          : ''
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 text-slate-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMember || !selectedPlan || createSubscriptionMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {createSubscriptionMutation.isPending ? 'Assigning...' : 'Assign Subscription'}
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
