import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Service } from '../../types';
import {
  Briefcase,
  Users,
  List,
  LayoutGrid,
  Download,
  CreditCard,
  CheckCircle,
  Filter,
  Hash,
  Building,
  User,
  Hourglass,
  FileText,
  ShieldCheck,
  RefreshCw,
  Mail,
  Clock,
} from 'lucide-react';
import ServiceDetailsModal from '../../components/ServiceDetailsModal';
import { useAuth } from '../../context/AuthContext';
import SearchBar from '../../components/filters/SearchBar';
import FilterSidebar from '../../components/filters/FilterSidebar';
import EmptyState from '../../components/filters/EmptyState';
import {
  buildFilterResolvers,
  filterItems,
  initializeFilters,
} from '../../utils/filters';
import {
  SERVICE_FILTER_FIELDS,
  SERVICE_SEARCH_FIELDS,
  SERVICE_SEARCH_GETTERS,
} from '../../utils/filterDefinitions';
import { useCardPagination } from '../../hooks/useCardPagination';
import CardPagination from '../../components/filters/CardPagination';

const MemberServices: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const { data: services, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services?mode=dashboard').then((r) => r.data),
  });

  const { data: userPayments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const isLoading = servicesLoading || paymentsLoading;

  const serviceFilterResolvers = useMemo(
    () => buildFilterResolvers(SERVICE_FILTER_FIELDS),
    []
  );

  const filters = useMemo(() => {
    if (!services || services.length === 0) return [];
    return initializeFilters(services, SERVICE_FILTER_FIELDS);
  }, [services]);

  const filtered = useMemo(() => {
    if (!services?.length) return [];
    return filterItems(
      services,
      searchText,
      selectedFilters,
      SERVICE_SEARCH_FIELDS,
      serviceFilterResolvers,
      SERVICE_SEARCH_GETTERS
    );
  }, [services, searchText, selectedFilters, serviceFilterResolvers]);

  const paginationResetKey = `${searchText}|${JSON.stringify(selectedFilters)}`;
  const {
    pagedItems: pagedServices,
    currentPage,
    totalPages,
    setPage,
    totalItems,
    pageSize,
  } = useCardPagination(filtered, 4, paginationResetKey);

  const handleFilterChange = (filterKey: string, value: string, checked: boolean) => {
    setSelectedFilters((prev) => {
      const current = prev[filterKey] || [];
      const next = checked
        ? [...current, value]
        : current.filter((v) => v !== value);
      return { ...prev, [filterKey]: next };
    });
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    setSearchText('');
  };

  return (
    <div className="max-w-6xl space-y-6 font-poppins px-1 sm:px-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span aria-hidden>🛠️</span> Organization Services
          </h1>
          <p className="text-sm text-slate-500 mt-1">Browse services, subscribe, and manage your subscriptions.</p>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto">
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

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 py-2 px-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            <Filter size={16} />
            Filters
            {Object.values(selectedFilters).some((arr) => arr.length > 0) && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                {Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar
        value={searchText}
        onChange={setSearchText}
        placeholder="Search by title, code, department, owner, category, status..."
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-8 items-start">
        <FilterSidebar
          filters={filters}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          isMobileOpen={isMobileFiltersOpen}
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
          className="lg:w-72"
        />

        <div className="flex-1 min-w-0">
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
            <EmptyState
              title="No services found"
              description="Try adjusting your search or filters to find what you're looking for."
            />
          ) : (
            <>
            <ul className="space-y-4">
              {pagedServices.map((service) => {
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
                    {/* Premium Header Layout */}
                    <div className="flex items-start gap-4">
                      {/* Left Icon Block */}
                      <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
                        <Briefcase size={22} strokeWidth={2} />
                      </div>

                      {/* Title & Subscription Badges */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 
                            className="text-lg font-black text-slate-900 break-words cursor-pointer hover:text-sky-600 transition-colors flex items-center gap-2"
                            onClick={() => setSelectedService(service)}
                          >
                            {service.title}
                            {isSubscribed && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
                          </h2>
                          
                          {/* Badges placed inline cleanly */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {isPaymentRequired ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                Paid
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Free
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 capitalize">
                              {service.category || 'General'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              service.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' :
                              service.status === 'Suspended' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              service.status === 'Archived' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                              service.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-sky-100 text-sky-800 border-sky-200'
                            }`}>
                              {service.status || 'Active'}
                            </span>
                          </div>
                        </div>

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

                    {/* Rich Metadata Properties Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2.5 text-xs text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>Service Code:</strong> {service.code || 'SVC-N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Building size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>Department:</strong> {service.department || 'General Support'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <User size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>Owner:</strong> {service.owner || 'System Admin'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Hourglass size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>Duration:</strong> {service.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate">
                          <strong>Documents Required:</strong> {service.requiredDocuments && Array.isArray(service.requiredDocuments) ? service.requiredDocuments.length : 0} file(s)
                        </span>
                      </div>
                      {service.slaHours && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>SLA Support:</strong> {service.slaHours} hours response</span>
                        </div>
                      )}
                      {service.contactEmail && (
                        <div className="flex items-center gap-2 min-w-0 col-span-1 sm:col-span-2">
                          <Mail size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Support Email:</strong> {service.contactEmail}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 min-w-0 col-span-1 sm:col-span-2 md:col-span-3">
                        <ShieldCheck size={15} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>Eligibility:</strong> {service.eligibilityRules || 'Active members only'}</span>
                      </div>
                      {isPaymentRequired && (
                        <div className="flex items-center gap-2 min-w-0 font-bold text-slate-900 col-span-1 sm:col-span-2">
                          <CreditCard size={15} className="text-slate-400 shrink-0" />
                          <span><strong>Service Fee:</strong> ETB {Number(service.price).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {service.description ? (
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 text-sm text-slate-700 whitespace-pre-wrap break-words line-clamp-3">
                        {service.description}
                      </div>
                    ) : null}
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
            <CardPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              itemLabel="services"
            />
            </>
          )}
        </div>
      </div>

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