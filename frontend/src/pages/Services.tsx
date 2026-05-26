import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Service } from '../types';
import {
  Tag,
  CreditCard,
  Clock,
  Users,
  CheckCircle2,
  Filter,
  Hash,
  Building,
  User,
  Hourglass,
  FileText,
  ShieldCheck,
  Briefcase,
  Mail,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/filters/SearchBar';
import FilterSidebar from '../components/filters/FilterSidebar';
import EmptyState from '../components/filters/EmptyState';
import {
  buildFilterResolvers,
  filterItems,
  initializeFilters,
} from '../utils/filters';
import {
  SERVICE_FILTER_FIELDS,
  SERVICE_SEARCH_FIELDS,
  SERVICE_SEARCH_GETTERS,
} from '../utils/filterDefinitions';
import { useCardPagination } from '../hooks/useCardPagination';
import CardPagination from '../components/filters/CardPagination';

const HOST_CHECKLIST = [
  'Easy service creation and management',
  'Automated request tracking',
  'Real-time approval workflow',
  'Integrated member communication',
  'Service analytics and reporting',
];

const Services: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const {
    data: services,
    isLoading,
    isError,
  } = useQuery<Service[]>({
    queryKey: ['public-services'],
    queryFn: () => api.get('/services').then((res) => res.data),
  });

  const serviceFilterResolvers = useMemo(
    () => buildFilterResolvers(SERVICE_FILTER_FIELDS),
    []
  );

  const filters = useMemo(() => {
    if (!services || services.length === 0) return [];
    return initializeFilters(services, SERVICE_FILTER_FIELDS);
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
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
  } = useCardPagination(filteredServices, 4, paginationResetKey);

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
    <div className="min-h-screen bg-[#f7f8f6] font-poppins text-gray-800">
      <GuestNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark tracking-tight mb-4">
            Available Services
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Discover resources and professional services offered by our organization
          </p>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by title, code, department, owner, category, status..."
          />
        </div>

        <div className="mb-6 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            Filters
            {Object.values(selectedFilters).some((arr) => arr.length > 0) && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-indigo-600 text-white">
                {Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0)}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <FilterSidebar
            filters={filters}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isMobileOpen={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
            variant="card"
          />

          <div className="flex-1 w-full min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                <p className="font-bold">Could not load services</p>
                <p className="text-sm mt-2">Check that the API is running, then refresh the page.</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pagedServices.map((service, index) => (
                  <article
                    key={service.id}
                    className="bg-white rounded-2xl shadow-md shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
                  >
                    <div 
                      className="relative h-52 sm:h-56 bg-brand-pale/20 shrink-0 cursor-pointer overflow-hidden group"
                      onClick={() => user ? setSelectedService(service) : (service.organizationId ? navigate(`/register?org=${service.organizationId}`) : navigate('/register'))}
                    >
                      <CoverImage
                        stored={service.image}
                        slotIndex={(currentPage - 1) * pageSize + index}
                        variant="service"
                        alt=""
                        className="w-full h-full object-cover min-h-[13rem] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4">
                      {/* Premium Title Header Block */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0 shadow-sm">
                          <Briefcase size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 
                            className="text-lg font-bold text-brand-dark leading-snug cursor-pointer hover:text-brand-medium transition-colors break-words"
                            onClick={() => user ? setSelectedService(service) : (service.organizationId ? navigate(`/register?org=${service.organizationId}`) : navigate('/register'))}
                            title="Click to view full details"
                          >
                            {service.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {service.payment_required ? (
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
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 capitalize">
                              {service.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Extended Properties Grid (Unique to Services) */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs text-gray-600 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Code:</strong> {service.code || 'SVC-N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Building size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Dept:</strong> {service.department || 'General'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <User size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Owner:</strong> {service.owner || 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Hourglass size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>SLA:</strong> {service.duration || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0 col-span-2">
                          <FileText size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Docs Required:</strong> {service.requiredDocuments && Array.isArray(service.requiredDocuments) ? service.requiredDocuments.length : 0} file(s)</span>
                        </div>
                        {service.slaHours && (
                          <div className="flex items-center gap-2 min-w-0 col-span-2">
                            <Clock size={14} className="text-brand-medium shrink-0" />
                            <span className="truncate"><strong>SLA Support:</strong> {service.slaHours} hours response time</span>
                          </div>
                        )}
                        {service.contactEmail && (
                          <div className="flex items-center gap-2 min-w-0 col-span-2">
                            <Mail size={14} className="text-brand-medium shrink-0" />
                            <span className="truncate"><strong>Support Email:</strong> {service.contactEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0 col-span-2">
                          <ShieldCheck size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Eligibility:</strong> {service.eligibilityRules || 'Open to all members'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <Users size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Subscribers:</strong> {(service as any).subscribers?.length || 0} active</span>
                        </div>
                        {service.payment_required && service.price && (
                          <div className="flex items-center gap-2 min-w-0 font-bold text-gray-900">
                            <CreditCard size={14} className="text-brand-medium shrink-0" />
                            <span>Fee: ETB {Number(service.price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {service.description ? (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 whitespace-pre-wrap break-words border-l-2 border-brand-medium/30 pl-3">
                          {service.description}
                        </p>
                      ) : (
                        <div className="mb-6 flex-1" />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (user) {
                            setSelectedService(service);
                          } else {
                            if (service.organizationId) {
                              navigate(`/register?org=${service.organizationId}`);
                            } else {
                              navigate(`/register`);
                            }
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-brand-medium text-white font-bold text-sm hover:bg-brand-light transition-colors shadow-md shadow-brand-medium/25"
                      >
                        {user ? 'View Details' : 'Learn More'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
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
      </div>

      <section className="bg-gray-100 border-y border-gray-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-dark mb-4 tracking-tight">
                Want to Offer Your Own Services?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px] sm:text-base">
                Partner with us to reach your members and run professional service operations from request to completion—all in one place.
              </p>
              <ul className="space-y-4 mb-10">
                {HOST_CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-medium/15 text-brand-medium">
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                    </span>
                    <span className="text-gray-700 text-[15px] leading-snug pt-0.5">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-brand-dark px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-110 transition-all"
              >
                Learn More
              </Link>
            </div>
            <div className="order-first lg:order-none">
              <img
                src="/asset/images-for-blogs.jpeg"
                alt=""
                className="w-full h-[280px] sm:h-[340px] lg:h-[380px] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <GuestFooter />

      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          services={services}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  );
};

export default Services;