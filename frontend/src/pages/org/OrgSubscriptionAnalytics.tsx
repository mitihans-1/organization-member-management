
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, DollarSign, Users, AlertCircle, TrendingDown, TrendingUp, Clock } from 'lucide-react';

const OrgSubscriptionAnalytics: React.FC = () => {
  const { user } = useAuth();

  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery({
    queryKey: ['orgSubscriptions'],
    queryFn: () =>
      api.get(`/member-subscriptions/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['orgInvoices'],
    queryFn: () =>
      api.get(`/invoices/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'active') || [];
  const pausedSubscriptions = subscriptions?.filter((s: any) => s.status === 'paused') || [];
  const cancelledSubscriptions = subscriptions?.filter((s: any) => s.status === 'cancelled') || [];
  const expiredSubscriptions = subscriptions?.filter((s: any) => s.status === 'expired') || [];

  const totalRecurringRevenue = activeSubscriptions.reduce((sum: number, sub: any) => sum + (sub.plan?.price || 0), 0);
  const overdueInvoices = invoices?.filter((i: any) => i.status === 'overdue') || [];
  const paidInvoices = invoices?.filter((i: any) => i.status === 'paid') || [];

  const churnRate =
    subscriptions?.length > 0
      ? Math.round((cancelledSubscriptions.length / subscriptions.length) * 100)
      : 0;

  const renewalRate =
    subscriptions?.length > 0
      ? Math.round(
          ((subscriptions.length - cancelledSubscriptions.length - expiredSubscriptions.length) /
            subscriptions.length) *
            100
        )
      : 0;

  const stats = [
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions.length,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Recurring Revenue',
      value: `ETB ${totalRecurringRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      title: 'Overdue Invoices',
      value: overdueInvoices.length,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Churn Rate',
      value: `${churnRate}%`,
      icon: TrendingDown,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-8 font-poppins">
      <div>
        <h2 className="text-xl font-black text-slate-900">Subscription Analytics</h2>
        <p className="text-slate-500 text-sm">Track your subscription metrics and revenue</p>
      </div>

      {loadingSubscriptions || loadingInvoices ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-slate-100 mb-4" />
              <div className="h-4 bg-slate-100 rounded-lg mb-2 w-1/2" />
              <div className="h-8 bg-slate-100 rounded-lg w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className={`flex items-center justify-between mb-4`}>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <Icon size={24} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-500 uppercase">{stat.title}</p>
                  <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Subscription Status Breakdown</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-700">Active</span>
                  </div>
                  <span className="font-bold text-slate-900">{activeSubscriptions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-700">Paused</span>
                  </div>
                  <span className="font-bold text-slate-900">{pausedSubscriptions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-slate-700">Cancelled</span>
                  </div>
                  <span className="font-bold text-slate-900">{cancelledSubscriptions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-slate-500" />
                    <span className="text-slate-700">Expired</span>
                  </div>
                  <span className="font-bold text-slate-900">{expiredSubscriptions.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">Renewal Statistics</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-semibold">Renewal Rate</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={16} />
                      {renewalRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${renewalRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-700 font-semibold">Churn Rate</span>
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <TrendingDown size={16} />
                      {churnRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div
                      className="bg-rose-500 h-3 rounded-full transition-all"
                      style={{ width: `${churnRate}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-center p-4 bg-slate-50 rounded-xl">
                    <p className="text-2xl font-black text-sky-600">{paidInvoices.length}</p>
                    <p className="text-xs text-slate-500 font-bold">Paid Invoices</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-xl">
                    <p className="text-2xl font-black text-amber-600">{overdueInvoices.length}</p>
                    <p className="text-xs text-amber-700 font-bold">Overdue Invoices</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrgSubscriptionAnalytics;
