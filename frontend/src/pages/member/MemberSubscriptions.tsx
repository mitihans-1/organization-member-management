
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
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
  Upload,
  Smartphone,
  Wallet,
  ArrowLeft,
  X,
  UploadCloud,
} from 'lucide-react';
import { Invoice, MemberSubscription, MemberSubscriptionPlan } from '../../types';

const FEATURE_LABELS: Record<string, string> = {
  overview: 'Dashboard Overview',
  members: 'Member Management',
  events: 'Events',
  services: 'Services',
  news: 'News',
  contact: 'Contact',
  subscriptions: 'Member Subscriptions',
  payments: 'Payments',
  tickets: 'Tickets',
  chat: 'Chat',
  reports: 'Reports',
  'id-cards': 'ID Cards',
  licenses: 'Licenses',
  profile: 'Profile',
};

const MemberSubscriptions: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSubscription, setSelectedSubscription] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MemberSubscriptionPlan | null>(null);
  const [paymentMode, setPaymentMode] = useState<'direct' | 'manual' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe_birr' | 'ebirr' | 'chapa' | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [manualTransactionId, setManualTransactionId] = useState('');
  const [requiresManualEntry, setRequiresManualEntry] = useState(false);
  const [isChapaLoaded, setIsChapaLoaded] = useState(!!((window as any).Chapa || (window as any).chapa || (window as any).ChapaCheckout));
  const [isChapaFormInitializing, setIsChapaFormInitializing] = useState(false);

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

  const chapaMutation = useMutation({
    mutationFn: async (data: { planId: string; phoneNumber?: string }) => {
      const res = await api.post('/chapa/initialize/member-subscription', {
        planId: data.planId,
        phoneNumber: data.phoneNumber,
        mode: (window as any).ChapaCheckout ? 'inline' : 'standard'
      });
      return res.data;
    },
    onSuccess: (data) => {
      console.log('Payment initialization success, response data:', data);
      if (data.status === 'success') {
        const startPay = () => {
          const chapa = (window as any).Chapa || (window as any).chapa || (window as any).ChapaCheckout;
          const publicKey = import.meta.env.VITE_CHAPA_PUBLIC_KEY;
          
          console.log('Chapa SDK detection:', { 
            Chapa: !!(window as any).Chapa, 
            chapa: !!(window as any).chapa, 
            ChapaCheckout: !!(window as any).ChapaCheckout,
            keyLoaded: !!publicKey,
            keyPrefix: publicKey?.substring(0, 12)
          });

          const finalAmount = selectedPlan?.price || 0;

          if (finalAmount <= 0) {
            console.error('Invalid amount for Chapa initialization:', finalAmount);
            if (data.data?.checkout_url) window.location.href = data.data.checkout_url;
            return;
          }

          // INLINE EMBEDDED: Use the ChapaCheckout class to render in-platform
          if (chapa && publicKey) {
            console.log('Initializing Chapa Embedded Form with key:', publicKey.substring(0, 10) + '...');
            setIsChapaFormInitializing(true);
            
            const checkoutOptions = {
              public_key: publicKey.trim(),
              publicKey: publicKey.trim(),
              key: publicKey.trim(),
              tx_ref: data.tx_ref,
              txRef: data.tx_ref,
              amount: String(finalAmount),
              currency: 'ETB',
              email: user?.email || '',
              first_name: user?.name?.split(' ')[0] || 'User',
              firstName: user?.name?.split(' ')[0] || 'User',
              last_name: user?.name?.split(' ').slice(1).join(' ') || 'Name',
              lastName: user?.name?.split(' ').slice(1).join(' ') || 'Name',
              callback_url: `${import.meta.env.VITE_API_URL}/chapa/webhook`,
              callbackUrl: `${import.meta.env.VITE_API_URL}/chapa/webhook`,
              return_url: `${window.location.origin}/member/subscriptions?tx_ref=${data.tx_ref}`,
              returnUrl: `${window.location.origin}/member/subscriptions?tx_ref=${data.tx_ref}`,
              customization: {
                title: 'Member Subscription',
                description: `Subscribe to ${selectedPlan?.name || 'Plan'}`,
              },
              customizations: {
                title: 'Member Subscription',
                description: `Subscribe to ${selectedPlan?.name || 'Plan'}`,
              },
              onSuccessfulPayment: (res: any) => {
                console.log('Chapa: Payment successful', res);
                setShowPaymentModal(false);
                setShowPlans(false);
                queryClient.invalidateQueries({ queryKey: ['memberSubscriptions'] });
                queryClient.invalidateQueries({ queryKey: ['memberInvoices'] });
              },
              onClose: () => {
                console.log('Chapa: Form closed');
                setPaymentMode(null);
                setPaymentMethod(null);
              },
              onPaymentFailure: (err: any) => {
                console.error('Chapa Payment Error (Full Object):', err);
                if (typeof err === 'string') {
                    alert('Chapa Error: ' + err);
                } else if (err?.message) {
                    alert('Chapa Error: ' + err.message);
                } else {
                    alert('Chapa Error: Charge failed to initiate. Check console for details.');
                }
              }
            };

            try {
              const attemptInit = (attempts = 0) => {
                const container = document.getElementById('chapa-inline-form-member');
                if (container) {
                  container.innerHTML = '';
                  const CheckoutClass = (window as any).ChapaCheckout || chapa;
                  if (!CheckoutClass) {
                    console.error('Chapa SDK not loaded');
                    setIsChapaFormInitializing(false);
                    if (data.data?.checkout_url) {
                      window.location.href = data.data.checkout_url;
                    } else {
                      alert('Chapa SDK not loaded');
                    }
                    return;
                  }
                  if (typeof CheckoutClass === 'function') {
                    const checkout = new CheckoutClass(checkoutOptions);
                    try {
                      checkout.initialize('chapa-inline-form-member');
                      setIsChapaFormInitializing(false);
                    } catch (initErr) {
                      console.error('SDK Initialization Call Failed:', initErr);
                      setIsChapaFormInitializing(false);
                      if (data.data?.checkout_url) {
                        window.location.href = data.data.checkout_url;
                      } else {
                        alert('Failed to initialize payment form. Please try again.');
                      }
                    }
                  }
                } else if (attempts < 20) {
                  setTimeout(() => attemptInit(attempts + 1), 100);
                } else {
                  console.error('chapa-inline-form-member container not found');
                  setIsChapaFormInitializing(false);
                  alert('Payment container could not be loaded.');
                }
              };
              attemptInit();
              return;
            } catch (e) {
              console.error('Embedded form logic error:', e);
            }
          }

          // REDIRECT FALLBACK: If embedded form fails or SDK is missing
          if (data.data?.checkout_url) {
            console.log('Redirecting to Chapa checkout...');
            window.location.href = data.data.checkout_url;
          } else {
            alert('Payment initialization failed.');
            setPaymentMode(null);
          }
        };

        // Try to start immediately
        startPay();
      } else {
        setPaymentMode(null);
        alert(data.message || 'Chapa initialization failed.');
      }
    },
    onError: (error: any) => {
      setPaymentMode(null);
      alert(error.response?.data?.message || error.message || 'Failed to initialize Chapa payment');
    }
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      return api.post('/payments/member-to-org/upload-receipt', formData, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['memberInvoices'] });
      setShowPaymentModal(false);
      setShowPlans(false);
    },
    onError: (error: any) => {
      const errResponse = error.response?.data;
      if (errResponse?.requiresManualEntry) {
         setRequiresManualEntry(true);
      } else {
         alert(errResponse?.message || 'Error uploading receipt');
      }
    }
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

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    setPaymentMode(null);
    setPaymentMethod(null);
    setReceiptFile(null);
    setManualTransactionId('');
    setRequiresManualEntry(false);
  };

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

  const handleSelectPlan = (plan: MemberSubscriptionPlan) => {
    if (plan.price === 0) {
      // Free plan - subscribe directly
      subscribeMutation.mutate(plan.id);
    } else {
      // Paid plan - show payment modal
      setSelectedPlan(plan);
      setShowPlans(false);
      setShowPaymentModal(true);
    }
  };

  const handleManualPaymentSubmit = async () => {
    if (!selectedPlan || !receiptFile || !paymentMethod) return;
    
    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('planId', selectedPlan.id);
    formData.append('payment_method', paymentMethod);
    if (manualTransactionId) {
      formData.append('manual_transaction_id', manualTransactionId);
    }
    
    uploadReceiptMutation.mutate(formData);
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
          <button
            onClick={() => setShowPlans(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl font-bold shadow-sm transition"
          >
            <Plus size={18} />
            {activeSubscription ? 'Upgrade Plan' : 'Subscribe Now'}
          </button>
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
                      {FEATURE_LABELS[feature] || feature}
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
                      className={`bg-white rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition ${
                        activeSubscription?.plan?.id === plan.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200'
                      }`}
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
                              {FEATURE_LABELS[feature] || feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={activeSubscription && activeSubscription.plan?.id === plan.id}
                        className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-3 rounded-xl font-bold transition disabled:opacity-50"
                      >
                        {activeSubscription && activeSubscription.plan?.id === plan.id
                          ? 'Current Plan'
                          : activeSubscription
                          ? 'Upgrade'
                          : 'Subscribe'}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm z-[9999]"
          onClick={(e) => { if (e.target === e.currentTarget) closePaymentModal(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-payment-dialog-title"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {(paymentMode || paymentMethod) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (paymentMethod) setPaymentMethod(null);
                      else if (paymentMode) setPaymentMode(null);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 id="member-payment-dialog-title" className="text-xl font-black text-gray-900">
                  {!paymentMode
                    ? 'Choose Payment Method'
                    : paymentMode === 'direct'
                    ? 'Redirecting to Payment'
                    : !paymentMethod
                    ? 'Select Payment Provider'
                    : 'Upload Payment Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {!paymentMode ? (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button
                    type="button"
                    disabled={chapaMutation.isPending}
                    onClick={() => {
                      setPaymentMode('direct');
                      setPaymentMethod('chapa');
                      if (selectedPlan) chapaMutation.mutate({ planId: selectedPlan.id });
                    }}
                    className="flex flex-col items-center p-8 rounded-3xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50/10 transition-all text-center group disabled:opacity-50"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {chapaMutation.isPending ? (
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Smartphone className="h-8 w-8 text-indigo-600" />
                      )}
                    </div>
                    <span className="text-base font-black text-gray-900 mb-1">Direct Pay</span>
                    <p className="text-[11px] text-gray-500 max-w-[150px] leading-tight">
                      {chapaMutation.isPending ? 'Initializing...' : 'Instant activation via Telebirr, CBE Birr or Card. No receipt needed.'}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={chapaMutation.isPending}
                    onClick={() => setPaymentMode('manual')}
                    className="flex flex-col items-center p-8 rounded-3xl border-2 border-gray-100 hover:border-amber-600 hover:bg-amber-50/10 transition-all text-center group disabled:opacity-50"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-8 w-8 text-amber-600" />
                    </div>
                    <span className="text-base font-black text-gray-900 mb-1">Manual Pay</span>
                    <p className="text-[11px] text-gray-500 max-w-[150px] leading-tight">
                      Pay using your preferred app first, then upload a screenshot for verification.
                    </p>
                  </button>
                </div>
              ) : paymentMode === 'direct' ? (
                <div className="animate-in fade-in duration-500">
                   <div className="relative min-h-[400px]">
                      {/* Loader overlay - separate from the Chapa container to avoid React DOM conflicts */}
                      {isChapaFormInitializing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center py-12 bg-white/80 z-20 rounded-3xl">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
                            <h3 className="text-xl font-black text-gray-900">Initializing Secure Checkout...</h3>
                            <p className="text-sm text-gray-500 mt-2 text-center px-4">
                              Preparing the payment form. Please wait.
                            </p>
                        </div>
                      )}
                      
                      {/* This container will hold the Chapa Inline form rendered by their SDK */}
                      <div id="chapa-inline-form-member" className="min-h-[400px] border border-gray-100 rounded-3xl p-4 bg-gray-50/30" />
                   </div>
                   
                   {!chapaMutation.isSuccess && (
                      <div className="flex justify-center mt-6">
                         <button 
                           onClick={() => { setPaymentMode(null); setPaymentMethod(null); }}
                           className="text-gray-500 text-sm font-bold hover:text-gray-700 transition-colors"
                         >
                           Cancel and go back
                         </button>
                      </div>
                   )}
                </div>
              ) : !paymentMethod ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      type="button" 
                      onClick={() => setPaymentMode(null)}
                      className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={16} /> Change Method
                    </button>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Manual Upload</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('telebirr')}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'telebirr'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <img src="/asset/telebirr-logo.png" alt="Telebirr" className="h-10 w-10 object-contain mb-2" />
                      <span className="text-[10px] font-bold">Telebirr</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cbe_birr')}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'cbe_birr'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <img src="/asset/cbe-logo.png" alt="CBE Birr" className="h-10 w-10 object-contain mb-2" />
                      <span className="text-[10px] font-bold">CBE Birr</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ebirr')}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === 'ebirr'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-100 text-gray-600 hover:border-indigo-300'
                      }`}
                    >
                      <img src="/asset/ebirr-logo.png" alt="E-Birr" className="h-10 w-10 object-contain mb-2" />
                      <span className="text-[10px] font-bold">E-Birr</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      type="button" 
                      onClick={() => setPaymentMethod(null)}
                      className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft size={16} /> Change Provider
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-8 mb-6">
                     <div className="flex items-center gap-4 mb-4">
                        <img 
                            src={`/asset/${paymentMethod.toLowerCase().replace('_', '-')}-logo.png`} 
                            alt={paymentMethod} 
                            className="h-12 w-12 object-contain rounded-lg bg-white p-2 border border-gray-100" 
                        />
                        <div>
                          <h4 className="text-lg font-black text-gray-900">{paymentMethod.replace('_', ' ').toUpperCase()}</h4>
                          <p className="text-sm text-gray-500">Upload your payment receipt screenshot</p>
                        </div>
                     </div>

                     <div className="bg-white rounded-xl p-6 border border-gray-100">
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 mb-2">Upload Receipt</label>
                          <input
                            type="file"
                            accept="image/*"
                            className="block w-full text-sm text-gray-500
                              file:mr-4 file:py-2 file:px-4
                              file:rounded-xl file:border-0
                              file:text-sm file:font-bold
                              file:bg-indigo-50 file:text-indigo-700
                              hover:file:bg-indigo-100
                              cursor-pointer"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setReceiptFile(file);
                            }}
                          />
                          {receiptFile && (
                            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800 truncate">{receiptFile.name}</span>
                                <button 
                                  type="button" 
                                  onClick={() => setReceiptFile(null)} 
                                  className="text-red-600 hover:text-red-800 text-sm font-bold"
                                >
                                    Remove
                                </button>
                            </div>
                          )}
                        </div>

                        {requiresManualEntry && (
                          <div className="mb-4">
                              <label className="block text-sm font-bold text-gray-700 mb-2">Transaction ID</label>
                              <input 
                                type="text" 
                                value={manualTransactionId}
                                onChange={(e) => setManualTransactionId(e.target.value)}
                                placeholder="Enter Transaction ID from receipt"
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none"
                              />
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={!receiptFile || uploadReceiptMutation.isPending || !paymentMethod}
                          onClick={() => {
                            const formData = new FormData();
                            if (!selectedPlan || !paymentMethod) return;
                            formData.append('planId', selectedPlan.id);
                            if (receiptFile) formData.append('receipt', receiptFile);
                            formData.append('payment_method', paymentMethod);
                            if (manualTransactionId) {
                                formData.append('manual_transaction_id', manualTransactionId);
                            }
                            uploadReceiptMutation.mutate(formData);
                          }}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {uploadReceiptMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Submit Receipt'
                            )}
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
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

      {/* Invoice History Table */}
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
