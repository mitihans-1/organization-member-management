
import React, { useState } from 'react';
import OrgSubscriptionPlans from './OrgSubscriptionPlans';
import OrgMemberSubscriptions from './OrgMemberSubscriptions';
import OrgSubscriptionAnalytics from './OrgSubscriptionAnalytics';

const OrgSubscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'members' | 'analytics' | 'invoices'>('plans');

  const tabs = [
    { id: 'plans', label: 'Subscription Plans' },
    { id: 'members', label: 'Member Subscriptions' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="max-w-7xl space-y-6 font-poppins">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Subscriptions & Invoicing</h1>
        <p className="text-slate-500 text-sm">
          Admin roles: Manage plans, invoices, reminders, and analytics. Members self-subscribe primarily.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-1 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'plans' && <OrgSubscriptionPlans />}
          {activeTab === 'members' && <OrgMemberSubscriptions />}
          {activeTab === 'analytics' && <OrgSubscriptionAnalytics />}
        </div>
      </div>
    </div>
  );
};

export default OrgSubscriptions;
