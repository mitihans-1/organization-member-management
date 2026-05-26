import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, Zap, Lock, CreditCard, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';
import { useNavigate } from 'react-router-dom';

const PAYMENTS_UPGRADE_FLAG = 'omms_payments_open_upgrade';
const PAYMENTS_UPGRADE_PLAN = 'omms_payments_upgrade_plan_id';

type Tab = 'plans' | 'invoices' | 'payments';

const UpgradePlan: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('plans');

  const { data: plans, isLoading: loadingPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  const { data: invoices, isLoading: loadingInvoices } = useQuery({
    queryKey: ['orgInvoices'],
    queryFn: () =>
      user?.organizationId
        ? api.get(`/invoices/organizations/${user.organizationId}`).then((r) => r.data)
        : [],
    enabled: !!user?.organizationId,
  });

  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ['orgPayments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const list = plans?.length ? plans : [];
  const currentName = user?.plan?.name ?? 'Basic';

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'plans', label: 'Plans', icon: Zap },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  return (
    <div className="space-y-8 font-poppins">
      <OrgAdminPageHeader title="Organization Subscription" subtitle="Manage your organization plan, invoices, and payments" />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'plans' && (
          <div className="space-y-8">
            <div className="text-center">
              <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold text-indigo-800">
                Available Plans
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {loadingPlans ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-full mt-8"></div>
                  </div>
                ))
              ) : (
                list.map((plan: any) => {
                  const isCurrent = plan.name === currentName;
                  return (
                    <div
                      key={plan.id ?? plan.name}
                      className={`bg-white rounded-2xl border p-8 flex flex-col shadow-sm ${
                        plan.name === 'Pro' ? 'ring-2 ring-indigo-500 border-indigo-200 scale-[1.02] z-10' : 'border-gray-200'
                      }`}
                    >
                      {plan.name === 'Pro' && (
                        <div className="text-center -mt-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            Most popular
                          </span>
                        </div>
                      )}
                      <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {plan.name === 'Basic'
                          ? 'Free forever plan'
                          : plan.name === 'Enterprise'
                            ? 'Yearly plan'
                            : 'Monthly plan'}
                      </p>
                      <p className="text-3xl font-black text-gray-900 mt-4">
                        ${Number(plan.price).toFixed(2)}
                        <span className="text-base font-semibold text-gray-500"> /month</span>
                      </p>
                      <ul className="mt-6 space-y-3 text-sm text-gray-600 flex-1">
                        <li className="flex items-center gap-2">
                          <Users size={16} className="text-violet-500 shrink-0" />
                          Up to {plan.max_members ?? '—'} members
                        </li>
                        <li className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-500 shrink-0" />
                          Priority support
                        </li>
                        <li className="flex items-center gap-2">
                          <Lock size={16} className="text-amber-600 shrink-0" />
                          Secure system access
                        </li>
                      </ul>
                      {isCurrent ? (
                        <p className="mt-8 text-center text-sm font-bold text-gray-500">Your current plan</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              sessionStorage.setItem(PAYMENTS_UPGRADE_FLAG, '1');
                              sessionStorage.setItem(PAYMENTS_UPGRADE_PLAN, String(plan.id));
                            } catch {
                              /* private mode */
                            }
                            navigate('/org-admin/payments');
                          }}
                          className="mt-8 w-full py-3.5 px-4 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-md text-sm sm:text-base flex items-center justify-center text-center"
                        >
                          {plan.name === 'Enterprise' ? 'Get Enterprise' : plan.name === 'Pro' ? 'Get Pro' : `Get ${plan.name}`}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Invoice History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingInvoices ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : invoices?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No invoices yet</p>
                      </td>
                    </tr>
                  ) : (
                    invoices?.map((invoice: any) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {invoice.currency} {invoice.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`http://localhost:5000/api/invoices/${invoice.id}/print`, '_blank')}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Print
                            </button>
                            <button
                              onClick={() => api.get(`/invoices/${invoice.id}/pdf`).then((r) => window.open(r.data.pdfUrl, '_blank'))}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingPayments ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : payments?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No payments yet</p>
                      </td>
                    </tr>
                  ) : (
                    payments?.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          ${Number(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {payment.receipt_url ? (
                            <button
                              onClick={() => window.open(payment.receipt_url, '_blank')}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Receipt
                            </button>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePlan;
