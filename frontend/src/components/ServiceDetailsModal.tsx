import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Users, X, Mail, Tag, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { Service } from '../types';
import CoverImage from './CoverImage';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ServiceDetailsModalProps {
  service: Service;
  services?: Service[];
  onClose: () => void;
  showSubscribeActions?: boolean;
}

const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  services,
  onClose,
  showSubscribeActions = true,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'direct' | 'manual' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'telebirr' | 'cbe_birr' | 'ebirr' | 'chapa' | null>(null);
  const [manualTxnId, setManualTxnId] = useState('');

  const subscribeMutation = useMutation({
    mutationFn: (serviceId: string) => api.post(`/services/${serviceId}/subscribe`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      alert('Successfully subscribed to the service!');
      onClose();
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error subscribing to service');
    }
  });

  const chapaMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const res = await api.post('/chapa/initialize/service', { serviceId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === 'success' && data.data?.checkout_url) {
        window.location.href = data.data.checkout_url;
      }
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to initialize Chapa payment');
    }
  });

  const servicePaymentMutation = useMutation({
    mutationFn: (data: { serviceId: string; method: string; transactionId: string }) =>
      api.post('/payments/service', {
        service_id: data.serviceId,
        payment_method: data.method,
        manual_transaction_id: data.transactionId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowPaymentForm(false);
      setPaymentMethod(null);
      setManualTxnId('');
      alert('Service payment submitted! An admin will confirm your subscription shortly.');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error submitting service payment');
    }
  });

  const isPaymentRequired = !!(service.payment_required && service.price && service.price > 0);

  const handleServicePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod || !manualTxnId.trim()) return;
    servicePaymentMutation.mutate({
      serviceId: service.id,
      method: paymentMethod,
      transactionId: manualTxnId
    });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors focus:outline-none"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        <div className="w-full h-64 sm:h-80 bg-brand-pale/20 relative shrink-0">
          <CoverImage
            stored={service.image}
            slotIndex={services ? services.findIndex((s) => s.id === service.id) : 0}
            variant="event"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-brand-dark leading-tight flex-1 flex items-center gap-2">
              {service.title}
              {user && service.subscribersIds?.includes(user.id) && <CheckCircle size={24} className="text-emerald-500" />}
            </h2>
            {service.category && (
              <span className="inline-block px-3 py-1 bg-brand-pale text-brand-dark text-sm font-bold rounded-full h-fit whitespace-nowrap capitalize">
                {service.category}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-8 text-sm text-gray-700 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-brand-medium" />
              <span className="font-medium">Permanent Service</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={18} className="text-brand-medium" />
              <span className="font-medium">{service._count?.subscribers || 0} subscribers</span>
            </div>
            {service.contactEmail && (
              <div className="flex items-center gap-2 w-full">
                <Mail size={18} className="text-brand-medium shrink-0" />
                <a 
                  href={`mailto:${service.contactEmail}`}
                  className="font-medium text-gray-700 hover:text-brand-medium transition-colors break-all"
                >
                  {service.contactEmail}
                </a>
              </div>
            )}
            {isPaymentRequired && (
              <span className="flex items-center gap-2 font-bold text-slate-900">
                <CreditCard size={18} className="text-slate-400" />
                ETB {Number(service.price).toFixed(2)}
              </span>
            )}
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">About this Service</h3>
            <div className="text-gray-600 prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
              {service.description ? service.description : <span className="italic text-gray-400">No additional details provided.</span>}
            </div>
          </div>

          {showSubscribeActions && (
            user && service.subscribersIds?.includes(user.id) ? (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
                <span className="font-bold">You are subscribed to this service</span>
              </div>
            ) : !isPaymentRequired ? (
            <button
              type="button"
              disabled={subscribeMutation.isPending}
              onClick={() => {
                if (user) {
                  subscribeMutation.mutate(service.id);
                } else {
                  if (service.organizationId) {
                    navigate(`/register?org=${service.organizationId}`);
                  } else {
                    navigate(`/register`);
                  }
                }
              }}
              className="w-full py-4 rounded-xl bg-brand-medium text-white font-bold text-base hover:bg-brand-light transition-all shadow-md shadow-brand-medium/25 hover:shadow-lg focus:outline-none disabled:opacity-50"
            >
              {subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe to this Service'}
            </button>
            ) : !showPaymentForm ? (
            <button
              type="button"
              onClick={() => setShowPaymentForm(true)}
              className="w-full py-4 rounded-xl bg-brand-medium text-white font-bold text-base hover:bg-brand-light transition-all shadow-md shadow-brand-medium/25 hover:shadow-lg focus:outline-none flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Pay {Number(service.price).toFixed(2)} ETB & Subscribe
            </button>
            ) : !paymentMode ? (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  type="button"
                  disabled={chapaMutation.isPending}
                  onClick={() => {
                    setPaymentMode('direct');
                    chapaMutation.mutate(service.id);
                  }}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 hover:border-brand-medium hover:bg-brand-pale/5 transition-all text-center group"
                >
                  <div className="h-12 w-12 rounded-xl bg-brand-pale/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <CreditCard className="h-6 w-6 text-brand-medium" />
                  </div>
                  <span className="text-sm font-black text-slate-900 mb-1">Direct Pay</span>
                  <span className="text-[10px] text-slate-500">Instant activation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode('manual')}
                  className="flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 hover:border-brand-medium hover:bg-brand-pale/5 transition-all text-center group"
                >
                  <div className="h-12 w-12 rounded-xl bg-brand-pale/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Tag className="h-6 w-6 text-brand-medium" />
                  </div>
                  <span className="text-sm font-black text-slate-900 mb-1">Manual Pay</span>
                  <span className="text-[10px] text-slate-500">Upload screenshot</span>
                </button>
              </div>
            ) : paymentMode === 'manual' && (
            <form onSubmit={handleServicePayment} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                 <button 
                  type="button" 
                  onClick={() => { setPaymentMode(null); setPaymentMethod(null); }}
                  className="text-xs font-bold text-brand-medium hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={12} /> Change Method
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Upload</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('telebirr')}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'telebirr' ? 'border-brand-medium bg-brand-medium/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img src="/asset/telebirr-logo.png" alt="Telebirr" className="h-10 w-10 object-contain mb-2" />
                  <span className="text-[10px] font-bold text-slate-900">Telebirr</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cbe_birr')}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cbe_birr' ? 'border-brand-medium bg-brand-medium/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img src="/asset/cbe-logo.png" alt="CBE Birr" className="h-10 w-10 object-contain mb-2" />
                  <span className="text-[10px] font-bold text-slate-900">CBE Birr</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ebirr')}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'ebirr' ? 'border-brand-medium bg-brand-medium/5' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img src="/asset/ebirr-logo.png" alt="E-Birr" className="h-10 w-10 object-contain mb-2" />
                  <span className="text-[10px] font-bold text-slate-900">E-Birr</span>
                </button>
              </div>
              {paymentMethod && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">
                    <p className="font-bold text-amber-900 mb-1">Transfer to:</p>
                    <p className="font-mono text-amber-800">+251 912 345 678</p>
                    <p className="mt-2 font-bold text-amber-900">Amount: <span className="text-xl">ETB {Number((service as any).price).toFixed(2)}</span></p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transaction ID</label>
                    <input
                      type="text"
                      required
                      value={manualTxnId}
                      onChange={(e) => setManualTxnId(e.target.value)}
                      placeholder="Enter your transaction ID"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={servicePaymentMutation.isPending || !manualTxnId.trim()}
                    className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                  >
                    {servicePaymentMutation.isPending ? 'Submitting...' : 'Submit Payment & Subscribe'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowPaymentForm(false); setPaymentMethod(null); setManualTxnId(''); }}
                    className="w-full py-2 text-gray-500 font-medium text-sm hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal;
