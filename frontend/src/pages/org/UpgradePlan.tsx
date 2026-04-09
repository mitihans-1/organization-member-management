import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, Zap, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';

const UpgradePlan: React.FC = () => {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = React.useState<number | null>(null);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  const handleUpgrade = async (planId: number) => {
    setLoadingPlan(planId);
    try {
      const response = await api.post('/payments/initialize', { planId });
      if (response.data.status === 'success' && response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      } else {
        alert('Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('An error occurred. Please check your connection.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const list = plans?.length
    ? plans
    : [
        { id: 1, name: 'Basic', price: 0, billing_cycle: 'monthly', max_members: 5 },
        { id: 2, name: 'Pro', price: 25, billing_cycle: 'monthly', max_members: 500 },
        { id: 3, name: 'Enterprise', price: 50, billing_cycle: 'yearly', max_members: 5000 },
      ];

  const currentName = user?.plan?.name ?? 'Basic';

  return (
    <div className="space-y-10 font-poppins">
      <OrgAdminPageHeader title="Upgrade Your Plan" subtitle="Choose the plan that fits your organization" />

      <div className="text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-xs font-bold text-indigo-800">
          Personal
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {list.map((plan: any) => {
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
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingPlan !== null}
                  className="mt-8 w-full py-4 rounded-full bg-indigo-600 text-white font-black hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.name === 'Enterprise' ? 'Get Enterprise' : plan.name === 'Pro' ? 'Get Pro' : `Get ${plan.name}`
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpgradePlan;
