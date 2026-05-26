
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  CreditCard as PayIcon,
  Plus,
  Shield,
  ArrowRight,
  XCircle,
} from 'lucide-react';
import { Invoice, MemberSubscription, MemberSubscriptionPlan } from '../../types';

const MemberSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const { data: subscriptions, isLoading: loadingSubscriptions } = useQuery<MemberSubscription[]>({
    queryKey: ['memberSubscriptions'],
    queryFn: () => api.get('/member-subscriptions/member').then((r) => r.data),
    enabled: !!user,
  });

  const { data: availablePlans, isLoading: loadingPlans } = useQuery<MemberSubscriptionPlan[]>({
    queryKey: ['availablePlans'],
    queryFn: () => api.get('/member-subscriptions/member/available-plans').then((r) => r.data),
    enabled: !!user,
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery<Invoice[]>({
    queryKey: ['memberInvoices'],
    queryFn: () => api.get('/invoices/member').then((r) => r.data),
    enabled: !!user,
  });

  const { data: recurringPayments, isLoading: loadingRecurring } = useQuery({
    queryKey: ['recurringPayments', selectedSubscription],
    queryFn: () =>
      selectedSubscription
        ? api.get(`/member-subscriptions/subscriptions/${selectedSubscription}/recurring-payments`).then((r) => r.data)
        : [],
    enabled: !!selectedSubscription,
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) =>
      api.post('/member-subscriptions/member/subscribe', { planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['memberInvoices'] });
      setShowPlans(false);
    },
  });

  const activeSubscription = subscriptions?.find((s) => s.status === 'active');

  useEffect(() => {
    if (activeSubscription && !selectedSubscription) {
      setSelectedSubscription(activeSubscription.id);
    }
  }, [activeSubscription, selectedSubscription]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'paused':
      case 'sent':
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'cancelled':
      case 'overdue':
      case 'void':
        return 'bg-rose-100 text-rose-800';
      case 'expired':
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRecurringPaymentStatus = (invoice: any) => {
    if (invoice.status === 'paid') return 'Paid';
    if (invoice.status === 'overdue') return 'Overdue';
    if (invoice.dueDate && new Date(invoice.dueDate) > new Date()) return 'Upcoming';
    return 'Pending';
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const printInvoice = (invoiceId: string) => {
    window.open(`${import.meta.env.VITE_API_URL}/invoices/${invoiceId}/print`, '_blank');
  };

  return (
    <div className="max-w-7xl space-y-8 font-poppins">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-8 py-10 shadow-lg">
        <h1 className="text-3xl font-black">My Subscriptions & Invoices</h1>
        <p className="mt-2 text-sky-100 text-sm">Manage your subscriptions and view all invoices.</p>
      </div>

      {/* Current Subscription Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="text-sky-600" size={24} />
            Current Subscription
          </h2>
          {!activeSubscription && (
            <button
              onClick={() => setShowPlans(true)}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition"
            >
              <Plus size={18} />
              Subscribe Now
            </button>
          )}
        </div>

        {loadingSubscriptions ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-slate-100 rounded-xl" />
            <div className="h-8 bg-slate-100 rounded-xl w-1/2" />
          </div>
        ) : activeSubscription ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-black text-slate-900">{activeSubscription.plan?.name}</h3>
              <p className="text-slate-600 mt-2">{activeSubscription.plan?.description}</p>

              {activeSubscription.trialEndsAt && new Date(activeSubscription.trialEndsAt) > new Date() && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Shield className="text-amber-600" size={20} />
                    <span className="font-bold text-amber-800">
                      Free trial ends on {new Date(activeSubscription.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {activeSubscription.plan?.features && activeSubscription.plan.features.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {activeSubscription.plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle className="text-emerald-500" size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-600">Status</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                    activeSubscription.status
                  )}`}
                >
                  {activeSubscription.status.charAt(0).toUpperCase() + activeSubscription.status.slice(1)}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-600 flex items-center gap-2">
                  <Calendar size={16} />
                  Next Billing Date
                </span>
                <span className="font-semibold text-slate-900">
                  {activeSubscription.nextBillingDate
                    ? new Date(activeSubscription.nextBillingDate).toLocaleDateString()
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-slate-600">Auto Renew</span>
                <span className="font-semibold text-slate-900">
                  {activeSubscription.autoRenew ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-2">
                  <DollarSign size={16} />
                  Price
                </span>
                <span className="text-2xl font-black text-sky-600">
                  {activeSubscription.plan?.currency} {activeSubscription.plan?.price.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-500 text-lg mb-4">You don't have any active subscriptions yet.</p>
            <button
              onClick={() => setShowPlans(true)}
              className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold shadow-sm transition"
            >
              <Plus size={18} />
              Choose a Plan
            </button>
          </div>
        )}
      </div>

      {/* Available Plans Modal */}
      {showPlans && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">Choose a Subscription Plan</h2>
              <button
                onClick={() => setShowPlans(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              {loadingPlans ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-100 rounded-2xl p-6 animate-pulse">
                      <div className="h-8 bg-slate-200 rounded-lg mb-4" />
                      <div className="h-12 bg-slate-200 rounded-lg mb-4" />
                      <div className="h-32 bg-slate-200 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : availablePlans?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">No subscription plans available yet.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availablePlans?.map((plan) => (
                    <div
                      key={plan.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
                    >
                      <h3 className="text-xl font-black text-slate-900 mb-2">{plan.name}</h3>
                      <p className="text-slate-600 text-sm mb-4">{plan.description}</p>

                      <div className="mb-4">
                        <p className="text-3xl font-black text-sky-600">
                          {plan.currency} {plan.price.toLocaleString()}
                        </p>
                        <p className="text-slate-500 text-sm">per {plan.billingCycle}</p>
                        {plan.trialDays && (
                          <p className="text-amber-600 text-sm font-bold mt-1">
                            {plan.trialDays} days free trial
                          </p>
                        )}
                      </div>

                      {plan.features.length > 0 && (
                        <ul className="space-y-2 mb-6">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                              <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={() => subscribeMutation.mutate(plan.id)}
                        disabled={subscribeMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded-xl font-bold transition disabled:opacity-50"
                      >
                        {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recurring Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <PayIcon className="text-sky-600" size={24} />
            Recurring Payments
          </h2>
          {subscriptions && subscriptions.length > 1 && (
            <select
              value={selectedSubscription || ''}
              onChange={(e) => setSelectedSubscription(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
            >
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.plan?.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {loadingRecurring ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4">Loading recurring payments...</p>
          </div>
        ) : recurringPayments?.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-500 text-lg">No recurring payments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600">Invoice #</th>
                  <th className="text-left p-4 font-bold text-slate-600">Billing Period</th>
                  <th className="text-left p-4 font-bold text-slate-600">Due Date</th>
                  <th className="text-left p-4 font-bold text-slate-600">Amount</th>
                  <th className="text-left p-4 font-bold text-slate-600">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recurringPayments?.map((invoice: any) => (
                  <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{invoice.invoiceNumber}</td>
                    <td className="p-4 text-slate-700">
                      {invoice.billingPeriodStart && invoice.billingPeriodEnd ? (
                        <span>
                          {new Date(invoice.billingPeriodStart).toLocaleDateString()} -{' '}
                          {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-4 text-slate-700">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {invoice.currency} {invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          getRecurringPaymentStatus(invoice) === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : getRecurringPaymentStatus(invoice) === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : getRecurringPaymentStatus(invoice) === 'Upcoming'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {getRecurringPaymentStatus(invoice)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRecurringPaymentStatus(invoice) !== 'Paid' && (
                          <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition" title="Pay Now">
                            <PayIcon size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => printInvoice(invoice.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="Print Invoice"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => downloadInvoice(invoice.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="View Details">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="text-sky-600" size={24} />
            Invoice History
          </h2>
        </div>

        {loadingInvoices ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4">Loading invoices...</p>
          </div>
        ) : invoices?.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-4 text-slate-300" size={48} />
            <p className="text-slate-500 text-lg">No invoices found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-600">Invoice #</th>
                  <th className="text-left p-4 font-bold text-slate-600">Date</th>
                  <th className="text-left p-4 font-bold text-slate-600">Amount</th>
                  <th className="text-left p-4 font-bold text-slate-600">Status</th>
                  <th className="text-left p-4 font-bold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{invoice.invoiceNumber}</td>
                    <td className="p-4 text-slate-700">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {invoice.currency} {invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                          invoice.status
                        )}`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => printInvoice(invoice.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="Print Invoice"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => downloadInvoice(invoice.id)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                          title="Download PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="View Details">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberSubscriptions;
