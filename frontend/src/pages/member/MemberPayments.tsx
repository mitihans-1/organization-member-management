import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Payment, Event } from '../../types';
import { CreditCard, UploadCloud, Plus, X, ArrowLeft, Smartphone, ChevronDown, Check } from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const MemberPayments: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('other');
  const [paymentMode, setPaymentMode] = useState<'direct' | 'manual' | null>(null);
  const [formData, setFormData] = useState<{
    reason: string;
    amount: string;
    payment_method: '' | 'telebirr' | 'cbe_birr' | 'ebirr' | 'chapa';
    manual_transaction_id: string;
  }>({
    reason: '',
    amount: '',
    payment_method: '',
    manual_transaction_id: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const [requiresManualEntry, setRequiresManualEntry] = useState(false);
  const [ocrErrorMsg, setOcrErrorMsg] = useState('');
  /** First modal screen: Telebirr / CBE overview (only after user clicks Make payment). */
  const [showPaymentIntro, setShowPaymentIntro] = useState(false);
  /** Manual mode: Second screen (select app) vs Third screen (upload receipt) */
  const [methodConfirmed, setMethodConfirmed] = useState(false);
  const [isChapaLoaded, setIsChapaLoaded] = useState(!!((window as any).Chapa || (window as any).chapa || (window as any).ChapaCheckout));

  useEffect(() => {
    if (!(window as any).Chapa && !(window as any).chapa && !(window as any).ChapaCheckout) {
      const script = document.createElement('script');
      script.src = "https://js.chapa.co/v1/inline.js";
      script.async = true;
      script.onload = () => setIsChapaLoaded(true);
      document.body.appendChild(script);
    }
  }, []);

  useBodyScrollLock(isModalOpen);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const { data: organization } = useQuery({
    queryKey: ['myOrganization'],
    queryFn: () => api.get('/organizations/me').then((r) => r.data),
  });

  const { data: events } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((r) => r.data),
  });

  const paidEvents = events?.filter(e => e.payment_required && e.price && e.price > 0) || [];

  const memberPaymentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/payments/member-to-org/upload-receipt', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeModal();
    },
    onError: (error: any) => {
      const errResponse = error.response?.data;
      if (errResponse?.requiresManualEntry) {
        setRequiresManualEntry(true);
        setOcrErrorMsg(
          errResponse.message ||
            'We could not automatically read your receipt. Please enter the Transaction ID manually if you are sure.'
        );
      } else {
        setPaymentError(errResponse?.message || 'Payment submission failed.');
      }
    },
  });

  const chapaMutation = useMutation({
    mutationFn: async (data: { amount: string; reason: string; eventId?: string }) => {
      // For now we'll just use a generic event initialization or create a new endpoint for general payments
      const endpoint = data.eventId ? '/chapa/initialize/event' : '/chapa/initialize/plan'; // Fallback
      const res = await api.post(endpoint, {
        planId: !data.eventId ? 'general-payment' : undefined, // Placeholder
        eventId: data.eventId,
        amount: data.amount,
        reason: data.reason
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
            publicKey: !!publicKey 
          });

          // PREFER REDIRECT: Use checkout_url immediately to avoid SDK hanging issues
          if (data.data?.checkout_url) {
            console.log('Redirecting to checkout URL:', data.data.checkout_url);
            window.location.href = data.data.checkout_url;
            return;
          }

          // FALLBACK TO INLINE: Only if redirect URL is missing
          if (chapa && publicKey) {
            console.log('Launching Chapa payment modal as fallback...');
            
            const paymentData = {
              public_key: publicKey,
              tx_ref: data.tx_ref || `gen-${Date.now()}`,
              amount: formData.amount,
              currency: 'ETB',
              email: user?.email || '',
              first_name: user?.name?.split(' ')[0] || 'User',
              last_name: user?.name?.split(' ').slice(1).join(' ') || 'Name',
              title: formData.reason,
              description: `Payment for ${organization?.name || 'Organization'}`,
              callback_url: `${import.meta.env.VITE_API_URL}/chapa/webhook`,
              return_url: `${window.location.origin}/member/payments?tx_ref=${data.tx_ref}`,
              customization: {
                title: formData.reason,
                description: `Payment for ${organization?.name || 'Organization'}`,
              },
              onSuccess: () => {
                console.log('Chapa: Payment successful');
                closeModal();
                queryClient.invalidateQueries({ queryKey: ['payments'] });
              },
              onClose: () => {
                console.log('Chapa: Modal closed');
                setPaymentMode(null);
              },
              onError: (err: any) => {
                console.error('Chapa Error:', err);
                setPaymentError('Payment failed to initialize.');
                setPaymentMode(null);
              }
            };

            if (typeof chapa === 'function') {
               try {
                 const instance = new chapa(paymentData);
                 if (instance.open) instance.open();
                 else if (instance.pay) instance.pay();
               } catch (e) {
                 console.error('Failed to initialize Chapa class:', e);
                 setPaymentMode(null);
               }
            } else if (chapa.pay) {
              chapa.pay(paymentData);
            }
          } else {
            console.error('No checkout URL and no SDK found');
            setPaymentError('Payment initialization failed. Please try again.');
            setPaymentMode(null);
          }
        };

        // Execute immediately if we have a checkout_url
        if (data.data?.checkout_url) {
          startPay();
        } else {
          // Only wait for SDK if we don't have a redirect URL
          if (!(window as any).Chapa && !(window as any).chapa && !(window as any).ChapaCheckout) {
            setTimeout(startPay, 1000);
          } else {
            startPay();
          }
        }
      } else {
        setPaymentMode(null);
        setPaymentError(data.message || 'Chapa initialization failed.');
      }
    },
    onError: (error: any) => {
      setPaymentMode(null);
      setPaymentError(error.response?.data?.message || error.message || 'Failed to initialize Chapa payment');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setShowPaymentIntro(false);
    setPaymentMode(null);
    setSelectedEventId('other');
    setFormData({ reason: '', amount: '', payment_method: '', manual_transaction_id: '' });
    setReceiptFile(null);
    setPaymentError(null);
    setDetailsConfirmed(false);
    setMethodConfirmed(false);
    setRequiresManualEntry(false);
    setOcrErrorMsg('');
  };

  const openFreshPaymentModal = useCallback(() => {
    setPaymentMode(null);
    setSelectedEventId('other');
    setFormData({ reason: '', amount: '', payment_method: '', manual_transaction_id: '' });
    setReceiptFile(null);
    setPaymentError(null);
    setDetailsConfirmed(false);
    setMethodConfirmed(false);
    setRequiresManualEntry(false);
    setOcrErrorMsg('');
    setShowPaymentIntro(true);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const state = location.state as { openPaymentModal?: boolean } | null;
    if (!state?.openPaymentModal) return;
    openFreshPaymentModal();
    navigate('/member/payments', { replace: true });
  }, [location.state, navigate, openFreshPaymentModal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!receiptFile) {
      setPaymentError('Please upload a screenshot of your payment confirmation.');
      return;
    }
    if (requiresManualEntry && !formData.manual_transaction_id.trim()) {
      setPaymentError('Please enter the transaction ID from your receipt.');
      return;
    }

    const submissionData = new FormData();
    submissionData.append('reason', formData.reason);
    submissionData.append('amount', formData.amount);
    submissionData.append('payment_method', formData.payment_method);
    if (formData.manual_transaction_id.trim()) {
      submissionData.append('manual_transaction_id', formData.manual_transaction_id.trim());
    }
    submissionData.append('receipt', receiptFile);

    memberPaymentMutation.mutate(submissionData);
  };

  const payeePhone = organization?.payment_phone?.trim();
  const orgName = organization?.name as string | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-poppins">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your history below. Use <strong className="text-slate-700">Make payment</strong> when you are ready
            to pay with Telebirr or CBE Birr.
          </p>
        </div>
        <button
          type="button"
          onClick={openFreshPaymentModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500 sm:px-6 sm:py-3"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          Make payment
        </button>
      </div>

      <h2 className="text-lg font-black text-slate-900">Payment history</h2>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-bold text-slate-600">Reference</th>
              <th className="text-left p-4 font-bold text-slate-600">Amount</th>
              <th className="text-left p-4 font-bold text-slate-600">Method</th>
              <th className="text-left p-4 font-bold text-slate-600">Status</th>
              <th className="text-left p-4 font-bold text-slate-600">Date</th>
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
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  <CreditCard className="mx-auto mb-2 text-slate-300" size={32} />
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="p-4 font-medium text-slate-800">{p.reference_id || '—'}</td>
                  <td className="p-4 font-semibold text-slate-700">{p.amount} ETB</td>
                  <td className="p-4 uppercase text-xs font-bold text-slate-500 tracking-wider">
                    {p.payment_method?.replace('_', ' ') || '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm z-[9999]"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-payment-dialog-title"
          >
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {!showPaymentIntro && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!detailsConfirmed) {
                        setShowPaymentIntro(true);
                        return;
                      }
                      if (methodConfirmed) {
                        setMethodConfirmed(false);
                        return;
                      }
                      if (formData.payment_method) {
                        setFormData({ ...formData, payment_method: '' });
                        setRequiresManualEntry(false);
                        setOcrErrorMsg('');
                        setReceiptFile(null);
                      } else {
                        setDetailsConfirmed(false);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 id="member-payment-dialog-title" className="text-xl font-black text-gray-900">
                  {showPaymentIntro
                    ? 'Make a payment'
                    : paymentMode === 'direct'
                      ? 'Direct Payment Details'
                      : !detailsConfirmed
                        ? 'Manual Payment Details'
                        : !methodConfirmed
                          ? 'Choose Payment App'
                          : 'Upload Receipt'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              {paymentError && (
                <div className="mb-6 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-xl">
                  {paymentError}
                </div>
              )}

              {showPaymentIntro ? (
                <div className="space-y-8">
                  <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Choose Payment Method</h2>
                    <p className="text-slate-500">Select how you would like to make your payment.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* Direct Payment Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('direct');
                        setShowPaymentIntro(false);
                        setFormData(prev => ({ ...prev, payment_method: 'chapa' }));
                      }}
                      className="group flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-600 hover:shadow-xl transition-all text-center"
                    >
                      <div className="h-20 w-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Smartphone className="h-10 w-10 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Direct Payment</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Pay instantly using Chapa (Telebirr, CBE Birr, cards). No screenshot needed.
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        <span>Pay Instantly</span>
                        <Check className="h-4 w-4" />
                      </div>
                    </button>

                    {/* Manual Upload Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMode('manual');
                        setShowPaymentIntro(false);
                      }}
                      className="group flex flex-col items-center p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-amber-600 hover:shadow-xl transition-all text-center"
                    >
                      <div className="h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-10 w-10 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">Manual Upload</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Pay in your app first, then upload a screenshot for admin verification.
                      </p>
                      <div className="mt-6 flex items-center gap-2 text-amber-600 font-bold text-sm">
                        <span>Upload Receipt</span>
                        <Check className="h-4 w-4" />
                      </div>
                    </button>
                  </div>
                </div>
              ) : !detailsConfirmed || paymentMode === 'direct' ? (
                <div className="max-w-lg mx-auto min-h-[400px]">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">
                      {paymentMode === 'direct' ? 'Direct Payment' : 'Manual Payment'} Details
                    </h2>
                    <p className="text-sm text-slate-500">
                      {paymentMode === 'direct' 
                        ? "Confirm the amount and click the button to pay instantly via Chapa."
                        : "Tell your organization what this payment is for and how much you sent."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">What are you paying for?</label>
                      <div className="relative">
                        <select
                          value={selectedEventId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedEventId(val);
                            if (val === 'other') {
                              setFormData(prev => ({ ...prev, reason: '', amount: '' }));
                            } else {
                              const ev = paidEvents.find((event) => event.id === val);
                              if (ev) {
                                setFormData(prev => ({
                                  ...prev,
                                  reason: `Event: ${ev.title}`,
                                  amount: String(ev.price || ''),
                                }));
                              }
                            }
                          }}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all appearance-none bg-white pr-10"
                        >
                          <option value="other">Other reason (Type below)</option>
                          {paidEvents.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title} — {ev.price} ETB
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                      </div>
                    </div>

                    {selectedEventId === 'other' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Payment reason</label>
                        <input
                          type="text"
                          required
                          value={formData.reason}
                          onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                          placeholder="e.g. Monthly dues, donation, fee"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (ETB)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={formData.amount}
                        readOnly={selectedEventId !== 'other'}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        className={`w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all ${
                          selectedEventId !== 'other' ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''
                        }`}
                        placeholder="Enter amount"
                      />
                      {selectedEventId !== 'other' && (
                        <p className="mt-1 text-[10px] text-gray-400">
                          Amount is fixed for the selected event.
                        </p>
                      )}
                    </div>

                    {paymentMode === 'manual' && (
                       <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-900 mb-2 uppercase tracking-wider text-center">Manual Payment</p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!formData.reason || !formData.amount || chapaMutation.isPending}
                      onClick={() => {
                        if (paymentMode === 'direct') {
                          chapaMutation.mutate({
                            amount: formData.amount,
                            reason: formData.reason,
                            eventId: selectedEventId !== 'other' ? selectedEventId : undefined
                          });
                        } else {
                          setDetailsConfirmed(true);
                        }
                      }}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors mt-6 shadow-lg shadow-indigo-200"
                    >
                      {paymentMode === 'direct' ? (chapaMutation.isPending ? 'Initializing...' : 'Pay with Chapa') : 'Continue'}
                    </button>
                  </div>
                </div>
              ) : !methodConfirmed ? (
                <div className="max-w-3xl mx-auto">
                  <p className="mb-2 text-center text-gray-900 font-bold">How would you like to pay?</p>
                  <p className="mb-8 text-gray-600 text-center text-sm">
                    Send exactly <span className="font-black text-gray-900">{formData.amount} ETB</span>
                    {orgName ? (
                      <>
                        {' '}
                        to <span className="font-bold text-gray-800">{orgName}</span>
                      </>
                    ) : (
                      ' to your organization'
                    )}
                    . Pick the app you will use — you must upload a matching receipt afterward.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'telebirr' })}
                      className={`p-6 border-2 rounded-2xl flex-1 flex flex-col items-center gap-3 hover:shadow-lg transition-all text-center ${
                        formData.payment_method === 'telebirr' 
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20' 
                          : 'border-gray-200 bg-white hover:border-indigo-400'
                      }`}
                    >
                      <img
                        src="/asset/telebirr-logo.png"
                        alt="Telebirr"
                        className="w-20 h-20 object-contain rounded-xl"
                      />
                      <span className="font-black text-lg text-gray-800">Telebirr</span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Send from the Telebirr app to your organization&apos;s number. Use the success screen as your
                        receipt.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'cbe_birr' })}
                      className={`p-6 border-2 rounded-2xl flex-1 flex flex-col items-center gap-3 hover:shadow-lg transition-all text-center ${
                        formData.payment_method === 'cbe_birr' 
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20' 
                          : 'border-gray-200 bg-white hover:border-indigo-400'
                      }`}
                    >
                      <img
                        src="/asset/cbe-logo.png"
                        alt="CBE Birr"
                        className="w-20 h-20 object-contain"
                      />
                      <span className="font-black text-lg text-gray-800">CBE Birr</span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Pay with CBE Birr and capture the confirmation screen showing amount and reference.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: 'ebirr' })}
                      className={`p-6 border-2 rounded-2xl flex-1 flex flex-col items-center gap-3 hover:shadow-lg transition-all text-center ${
                        formData.payment_method === 'ebirr' 
                          ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600/20' 
                          : 'border-gray-200 bg-white hover:border-indigo-400'
                      }`}
                    >
                      <img
                        src="/asset/ebirr-logo.png"
                        alt="E-Birr"
                        className="w-20 h-20 object-contain"
                      />
                      <span className="font-black text-lg text-gray-800">E-Birr</span>
                      <span className="text-xs text-gray-500 leading-relaxed">
                        Pay using E-Birr and upload the confirmation screenshot for verification.
                      </span>
                    </button>
                  </div>

                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      disabled={!formData.payment_method}
                      onClick={() => setMethodConfirmed(true)}
                      className="px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors shadow-lg shadow-indigo-200"
                    >
                      Continue to payment detail
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto">
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <img
                      src={
                        formData.payment_method === 'telebirr' 
                          ? '/asset/telebirr-logo.png' 
                          : formData.payment_method === 'cbe_birr'
                          ? '/asset/cbe-logo.png'
                          : '/asset/ebirr-logo.png'
                      }
                      alt=""
                      className="w-10 h-10 object-contain"
                    />
                    <h4 className="text-xl font-black text-gray-800">
                      {formData.payment_method === 'telebirr' 
                        ? 'Telebirr payment' 
                        : formData.payment_method === 'cbe_birr'
                        ? 'CBE Birr payment'
                        : 'E-Birr payment'}
                    </h4>
                  </div>

                  <div className="mb-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-900 space-y-1">
                    <div>
                      <span className="text-indigo-600 font-semibold">Reason: </span>
                      <span className="font-medium">{formData.reason}</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 font-semibold">Amount: </span>
                      <span className="font-black">{formData.amount} ETB</span>
                    </div>
                    <div>
                      <span className="text-indigo-600 font-semibold">Method: </span>
                      <span className="font-medium uppercase tracking-wide">
                        {formData.payment_method === 'telebirr' 
                          ? 'Telebirr' 
                          : formData.payment_method === 'cbe_birr'
                          ? 'CBE Birr'
                          : 'E-Birr'}
                      </span>
                    </div>
                  </div>

                  <p className="mb-4 text-gray-800 text-sm font-medium bg-amber-50 border border-amber-100 p-4 rounded-lg">
                    Transfer exactly <strong className="text-amber-950">{formData.amount} ETB</strong> using{' '}
                    {formData.payment_method === 'telebirr' 
                      ? 'Telebirr' 
                      : formData.payment_method === 'cbe_birr'
                      ? 'CBE Birr'
                      : 'E-Birr'}{' '}
                    to your organization&apos;s number:
                    <strong className="text-xl tracking-wider text-amber-900 mt-2 block font-mono">
                      {payeePhone || '[Your admin has not set a receiving number yet]'}
                    </strong>
                  </p>

                  <ul className="mb-6 text-gray-600 text-sm list-disc list-inside space-y-1">
                    <li>Use the same method you selected so the receipt checker can validate your screenshot.</li>
                    <li>Upload a clear image of the success or confirmation screen (amount and reference visible).</li>
                    <li>
                      We try to read the transaction ID and amount automatically; if the image is unclear, you can type
                      the ID below after the first attempt.
                    </li>
                  </ul>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-gray-50/50">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <label className="cursor-pointer">
                        <span className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
                          Browse for image
                        </span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setReceiptFile(f);
                              setRequiresManualEntry(false);
                              setOcrErrorMsg('');
                              setFormData((prev) => ({ ...prev, manual_transaction_id: '' }));
                            }
                          }}
                        />
                      </label>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>

                    {receiptFile && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-700 font-medium">
                        Selected: {receiptFile.name}
                      </div>
                    )}

                    {requiresManualEntry && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="text-red-800 text-sm font-bold">{ocrErrorMsg}</div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Transaction ID / ref no.
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.manual_transaction_id}
                            onChange={(e) => setFormData({ ...formData, manual_transaction_id: e.target.value })}
                            placeholder="e.g. TXN123456789"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Your organization admin will match this ID to your uploaded screenshot before approving the
                            payment.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={
                          memberPaymentMutation.isPending ||
                          !receiptFile ||
                          (requiresManualEntry && !formData.manual_transaction_id.trim())
                        }
                        className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                      >
                        {memberPaymentMutation.isPending
                          ? 'Processing…'
                          : requiresManualEntry
                            ? 'Submit with manual ID'
                            : 'Verify payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
};

export default MemberPayments;
