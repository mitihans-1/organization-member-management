import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, Zap, Lock, Loader2, X, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';

const UpgradePlan: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = React.useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState<'telebirr' | 'chapa'>('telebirr');
  const [step, setStep] = React.useState<1 | 2>(1);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  const list = plans?.length
    ? plans
    : [
        { id: 1, name: 'Basic', price: 0, billing_cycle: 'monthly', max_members: 5 },
        { id: 2, name: 'Pro', price: 25, billing_cycle: 'monthly', max_members: 500 },
        { id: 3, name: 'Enterprise', price: 50, billing_cycle: 'yearly', max_members: 5000 },
      ];

  const selectedPlan = list.find((p: any) => p.id === selectedPlanId);

  const handleStartUpgrade = (planId: number) => {
    setSelectedPlanId(planId);
    setStep(1);
    setShowPaymentModal(true);
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPlanId) return;
    
    setLoadingPlan(selectedPlanId);
    try {
      const endpoint = paymentMethod === 'telebirr' ? '/payments/telebirr/initialize' : '/payments/initialize';
      const response = await api.post(endpoint, { planId: selectedPlanId });
      
      if (response.data.status === 'success' && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        alert('Failed to initialize payment. Please try again.');
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('An error occurred. Please check your connection.');
      setShowPaymentModal(false);
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentName = user?.plan?.name ?? 'Basic';

  return (
    <div className="space-y-10 font-poppins relative">
      <OrgAdminPageHeader title="Upgrade Your Plan" subtitle="Choose the plan that fits your organization" />

      <div className="text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold text-indigo-800">
          Organization Subscription
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto pb-20">
        {list.map((plan: any) => {
          const isCurrent = plan.name === currentName;
          return (
            <div
              key={plan.id ?? plan.name}
              className={`bg-white rounded-2xl border p-8 flex flex-col shadow-sm transition-all duration-300 ${
                plan.name === 'Pro' ? 'ring-2 ring-indigo-500 border-indigo-200 scale-[1.02] z-10 shadow-xl' : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
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
                <span className="text-base font-semibold text-gray-500"> /{plan.billing_cycle === 'yearly' ? 'year' : 'month'}</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600 flex-1">
                <li className="flex items-center gap-2">
                  <div className="bg-indigo-50 p-1 rounded">
                    <Users size={14} className="text-indigo-600 shrink-0" />
                  </div>
                  Up to {plan.max_members ?? '—'} members
                </li>
                <li className="flex items-center gap-2">
                   <div className="bg-amber-50 p-1 rounded">
                    <Zap size={14} className="text-amber-600 shrink-0" />
                  </div>
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                   <div className="bg-emerald-50 p-1 rounded">
                    <Lock size={14} className="text-emerald-600 shrink-0" />
                  </div>
                  Secure system access
                </li>
              </ul>
              {isCurrent ? (
                <div className="mt-8 flex items-center justify-center gap-2 text-indigo-600 font-bold bg-indigo-50 py-3 rounded-xl">
                  <Check size={18} />
                  <span>Current Plan</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStartUpgrade(plan.id)}
                  disabled={loadingPlan !== null}
                  className="mt-8 w-full py-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {step === 1 ? 'Select Payment Method' : 'Review Order'}
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            {step === 1 ? (
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500 mb-2">Choose your preferred way to pay:</p>
                
                {/* Telebirr Option */}
                <label 
                  className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'telebirr' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('telebirr')}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/telebirr-logo.png" alt="Telebirr" className="w-10 h-10 object-contain" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center">
                      <span className="font-bold text-gray-900">Telebirr</span>
                      <span className="ml-2 text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Primary</span>
                    </div>
                    <p className="text-xs text-gray-500">Fast local payment</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    paymentMethod === 'telebirr' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'telebirr' && <Check size={14} className="text-white" />}
                  </div>
                </label>

                {/* Chapa Option */}
                <label 
                  className={`relative flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'chapa' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setPaymentMethod('chapa')}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/chapa-logo.png" alt="Chapa" className="w-10 h-10 object-contain" />
                  </div>
                  <div className="ml-4 flex-1">
                    <span className="font-bold text-gray-900">Chapa</span>
                    <p className="text-xs text-gray-500">Bank or Wallet</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    paymentMethod === 'chapa' ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'chapa' && <Check size={14} className="text-white" />}
                  </div>
                </label>

                <div className="pt-4">
                  <button 
                    onClick={handleNextStep}
                    className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-300 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Selected Plan</span>
                    <span className="font-black text-gray-900">{selectedPlan?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Annual/Monthly Rate</span>
                    <span className="font-black text-gray-900">${selectedPlan?.price}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">Members Limit</span>
                    <span className="font-black text-brand-medium">{selectedPlan?.max_members}+ members</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Payment Via</span>
                    <div className="flex items-center gap-2">
                       <img 
                        src={paymentMethod === 'telebirr' ? '/telebirr-logo.png' : '/chapa-logo.png'} 
                        alt="method" 
                        className="w-5 h-5 object-contain" 
                      />
                      <span className="text-sm font-black capitalize text-gray-900">{paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleConfirmPayment}
                    disabled={loadingPlan !== null}
                    className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(79,70,229,0.3)]"
                  >
                    {loadingPlan ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Initializing Secure Checkout...
                      </>
                    ) : (
                      `Pay $${selectedPlan?.price} now`
                    )}
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full py-3 text-sm text-gray-500 font-bold hover:text-gray-900 transition-colors"
                  >
                    Change payment method
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 pb-6 pt-2">
               <p className="text-[10px] text-center text-gray-400">
                Authorized secure payment partner. Your transaction is encrypted and safe.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
