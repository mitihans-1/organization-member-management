import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CreditCard, CheckCircle, Briefcase } from 'lucide-react';
import { Service } from '../../types';
import useCountAnimation from '../../hooks/useCountAnimation';

const MemberOverview: React.FC = () => {
  const { user } = useAuth();

  // Get allowed features
  const { data: subscriptions } = useQuery({
    queryKey: ['member-subscriptions'],
    queryFn: () => api.get('/member-subscriptions/member').then(res => res.data),
    enabled: user?.role === 'member',
  });

  const activeSubscription = subscriptions?.find((s: any) => s.status === 'active');
  const allowedFeatures = activeSubscription?.plan?.features ?? (user as any)?.organization?.plan?.allowed_features ?? ['overview', 'profile', 'subscriptions'];

  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    enabled: user?.role === 'member',
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data),
    enabled: user?.role === 'member' && allowedFeatures.includes('services'),
  });

  const upcoming = allowedFeatures.includes('events') ? dash?.stats?.find((s: { label: string }) => s.label?.includes('Events'))?.value ?? '—' : null;
  const animatedUpcoming = useCountAnimation(upcoming ?? '—');
  const activeServices = allowedFeatures.includes('services') ? services?.filter((s) => s.status === 'Active') ?? [] : [];

  return (
    <div className="max-w-5xl space-y-8 font-poppins">
      <div className="rounded-2xl bg-sky-600 text-white px-8 py-10 shadow-lg">
        <h1 className="text-2xl font-black">Welcome back, {user?.name}!</h1>
        <p className="mt-2 text-sky-100 text-sm">Here&apos;s your membership overview for today.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Membership status</p>
            <p className="text-lg font-black text-emerald-600 mt-2">Active</p>
            <p className="text-sm text-slate-600 mt-1">{user?.plan?.name ?? 'Basic'} member</p>
            {user?.plan_expiry && (
              <p className="text-xs text-slate-400 mt-2">Renews {new Date(user.plan_expiry).toLocaleDateString()}</p>
            )}
          </div>
          {allowedFeatures.includes('events') && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Upcoming events</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{animatedUpcoming}</p>
              <Link to="/member/events" className="text-sm font-bold text-sky-600 mt-3 inline-block">
                View all →
              </Link>
            </div>
          )}
          {allowedFeatures.includes('payments') && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Outstanding dues</p>
              <p className="text-2xl font-black text-amber-600 mt-2">ETB 0.00</p>
              <p className="text-xs text-slate-500 mt-1">All payments up to date</p>
              <Link to="/member/payments" className="mt-3 inline-block text-sm font-bold text-sky-600 hover:text-sky-500">
                Payments →
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {allowedFeatures.includes('services') && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Briefcase size={20} className="text-sky-600" />
                Available Services
              </h2>
              <Link to="/member/services" className="text-sm font-bold text-sky-600">
                View all
              </Link>
            </div>
            {activeServices.length > 0 ? (
              <ul className="space-y-3 text-sm text-slate-700">
                {activeServices.slice(0, 3).map((service) => (
                  <li key={service.id} className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block">{service.title}</span>
                      <span className="text-xs text-slate-500">{service.status || 'Active'}</span>
                    </div>
                    <Link to="/member/services" className="text-sky-600 font-bold flex items-center">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No services available yet.</p>
            )}
          </div>
        )}

        {allowedFeatures.includes('events') && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-sky-600" />
                Upcoming events
              </h2>
              <Link to="/member/events" className="text-sm font-bold text-sky-600">
                View all
              </Link>
            </div>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex justify-between border-b border-slate-100 pb-2">
                <span>Board meeting</span>
                <Link to="/member/events" className="text-sky-600 font-bold">
                  RSVP
                </Link>
              </li>
              <li className="flex justify-between">
                <span>Community outreach</span>
                <Link to="/member/events" className="text-sky-600 font-bold">
                  RSVP
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      {allowedFeatures.includes('payments') && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <CreditCard size={20} className="text-sky-600" />
              Recent payments
            </h2>
            <Link to="/member/payments" className="text-sm font-bold text-sky-600">
              View all
            </Link>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-start border-b border-slate-100 pb-2">
              <span className="text-slate-700">Annual membership</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Paid
              </span>
            </li>
            <li className="flex justify-between items-start">
              <span className="text-slate-700">Event registration</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle size={14} /> Paid
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MemberOverview;
