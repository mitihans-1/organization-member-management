import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Users, Zap, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UpgradePlan: React.FC = () => {
  const { user } = useAuth();
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

  const currentName = user?.plan?.name ?? 'Basic';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black text-gray-900">Upgrade Your Plan</h1>
        <p className="text-gray-500 mt-2">Choose the plan that fits your organization</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {list.map((plan: any) => {
          const isCurrent = plan.name === currentName;
          return (
            <div
              key={plan.id ?? plan.name}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col"
            >
              <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {plan.name === 'Basic' ? 'Free forever plan' : `${plan.billing_cycle ?? 'monthly'} plan`}
              </p>
              <p className="text-3xl font-black text-gray-900 mt-4">
                ${Number(plan.price).toFixed(2)}
                <span className="text-base font-semibold text-gray-500">/month</span>
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
                  className="mt-8 w-full py-3 rounded-full bg-sky-600 text-white font-bold hover:bg-sky-500 transition-colors"
                >
                  Get {plan.name}
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
