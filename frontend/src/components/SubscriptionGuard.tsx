
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MemberSubscription } from '../types';
import { Navigate } from 'react-router-dom';

type Props = {
  children: React.ReactNode;
  /** If true, allow access even if no subscription (for basic features like profile) */
  allowBasic?: boolean;
};

const SubscriptionGuard: React.FC<Props> = ({ children, allowBasic = false }) => {
  const { user } = useAuth();

  const { data: subscriptions, isLoading } = useQuery<MemberSubscription[]>({
    queryKey: ['memberSubscriptions'],
    queryFn: () => api.get('/member-subscriptions/member').then((r) => r.data),
    enabled: !!user && user.role === 'member',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-slate-700">
        Checking subscription…
      </div>
    );
  }

  if (allowBasic) {
    return <>{children}</>;
  }

  const hasValidSubscription = subscriptions?.some((sub) => {
    if (sub.status === 'active') {
      // Check if trial is still active
      if (sub.trialEndsAt) {
        return new Date(sub.trialEndsAt) > new Date();
      }
      // No trial, just active subscription
      return true;
    }
    return false;
  });

  if (!hasValidSubscription) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-poppins">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center shadow-sm">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Subscription Required</h2>
          <p className="text-slate-600 mb-8">
            Your free trial has expired or you don't have an active subscription. Please subscribe to access this feature.
          </p>
          <button
            onClick={() => window.location.href = '/member/subscriptions'}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl px-4 py-3"
          >
            View Subscription Plans
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
