import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Service } from '../../types';
import { Briefcase, Users, List, LayoutGrid, Download, CreditCard, CheckCircle } from 'lucide-react';
import ServiceDetailsModal from '../../components/ServiceDetailsModal';
import { useAuth } from '../../context/AuthContext';

const FILTERS = ['All', 'General', 'Support', 'Training', 'Consulting', 'Membership'] as const;

const MemberServices: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((r) => r.data),
  });

  const { data: userPayments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const isLoading = servicesLoading || paymentsLoading;

  const filtered = useMemo(() => {
    if (!services?.length) return [];
    if (filter === 'All') return services;
    return services.filter((s) =>
      (s.title + (s.description || '')).toLowerCase().includes(filter.toLowerCase())
    );
  }, [services, filter]);

  return (
    <div className="max-w-4xl space-y-6 font-poppins px-1 sm:px-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span aria-hidden>🛠️</span> Organization Services
          </h1>
          <p className="text-sm text-slate-500 mt-1">Browse services, subscribe, and manage your subscriptions.</p>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-slate-200 overflow-hidden shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 ${
              view === 'list' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            <List size={16} />
            List
          </button>
          <button
            type="button"
            onClick={() => setView('grid')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-l border-slate-200 ${
              view === 'grid' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            <LayoutGrid size={16} />
            Grid
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {view === 'grid' && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
          Grid view coming soon! Switch to <strong>List</strong> for now.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <p className="text-slate-500 text-sm">No services match this filter.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((service) => {
            const isSubscribed = !!(user && service.subscribersIds?.includes(user.id));
            const pendingPayment = userPayments?.find(
              (p) => p.reference_type === 'service' && p.reference_id === service.id && p.status === 'pending'
            );
            const isPaymentRequired = !!(service.payment_required && service.price && service.price > 0);

            return (
              <li
                key={service.id}
                className={`bg-white border rounded-xl p-6 shadow-sm space-y-4 transition-all relative overflow-hidden ${
                  isSubscribed ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div className="absolute top-0 right-0">
                  {isPaymentRequired ? (
                    <div className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                      Paid
                    </div>
                  ) : (
                    <div className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
                      Free
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pr-12">
                  <div className="space-y-1">
                    <h2 
                      className="text-lg font-black text-slate-900 break-words cursor-pointer hover:text-sky-600 transition-colors flex items-center gap-2"
                      onClick={() => setSelectedService(service)}
                    >
                      {service.title}
                      {isSubscribed && <CheckCircle size={18} className="text-emerald-500" />}
                    </h2>
                    {isSubscribed ? (
                      <p className="text-xs font-bold text-emerald-600">You are subscribed to this service</p>
                    ) : pendingPayment ? (
                      <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Payment pending verification...
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <Briefcase size={16} className="text-slate-400" />
                    Permanent service
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    {service._count?.subscribers || 0} subscribers
                  </span>
                  {isPaymentRequired && (
                    <span className="flex items-center gap-2 font-bold text-slate-900">
                      <CreditCard size={16} className="text-slate-400" />
                      ETB {Number(service.price).toFixed(2)}
                    </span>
                  )}
                </div>
                {service.description && <p className="text-sm text-slate-700 line-clamp-2">{service.description}</p>}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-100"
                  >
                    View Details
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          services={services}
          onClose={() => setSelectedService(null)}
          showSubscribeActions={true}
        />
      )}
    </div>
  );
};

export default MemberServices;
