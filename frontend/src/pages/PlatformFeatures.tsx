import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Service } from '../types';
import {
  Settings,
  UserPlus,
  Database,
  Lock,
  Terminal,
  BarChart,
  Rocket,
  Globe,
  Filter,
  Hash,
  Building,
  User,
  Hourglass,
  FileText,
  ShieldCheck,
  Briefcase,
  Users,
  CreditCard,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
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

const PlatformFeatures: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['platform-services'],
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
    <div className="min-h-screen bg-[#f7f8f6] font-poppins">
      <GuestNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-brand-dark tracking-tight mb-4">
            Comprehensive <span className="text-brand-medium">Services</span> for Your Organization
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            We provide a complete ecosystem to help you manage every aspect of your membership-driven organization with ease and efficiency.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search services by title, description, or category..."
          />
        </div>

        {/* Mobile Filter Button */}
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

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isMobileOpen={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
          />

          {/* Content Area */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="p-12 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm animate-pulse"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 mb-10"></div>
                    <div className="h-6 bg-gray-100 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No services found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {pagedServices.map((service, idx) => (
                  <div
                    key={service.id}
                    className="p-12 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2"
                  >
                    {/* Premium Title Header Block */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-brand-pale/30 flex items-center justify-center group-hover:bg-brand-medium group-hover:text-white transition-all duration-300 text-brand-medium shadow-sm shrink-0">
                        <Briefcase size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-brand-dark break-words">{service.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
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
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-6 text-xs text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Hash size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>Code:</strong> {service.code || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>Dept:</strong> {service.department || 'General'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>Owner:</strong> {service.owner || 'Admin'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Hourglass size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>SLA:</strong> {service.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                        <FileText size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>Docs:</strong> {service.requiredDocuments && Array.isArray(service.requiredDocuments) ? service.requiredDocuments.length : 0} required</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                        <ShieldCheck size={13} className="text-brand-medium shrink-0" />
                        <span className="truncate"><strong>Rules:</strong> {service.eligibilityRules || 'Open'}</span>
                      </div>
                    </div>
                    {service.description ? (
                      <p className="text-gray-600 leading-relaxed text-base line-clamp-4 mb-6 flex-1 whitespace-pre-wrap break-words border-l-2 border-brand-medium/30 pl-3">
                        {service.description}
                      </p>
                    ) : (
                      <div className="mb-6 flex-1" />
                    )}
                    <Link
                      to="/contact"
                      className="mt-8 inline-flex items-center gap-2 text-brand-medium font-black group-hover:translate-x-2 transition-transform uppercase tracking-widest text-sm"
                    >
                      <span>Learn More</span>
                      <Rocket size={18} />
                    </Link>
                  </div>
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

      <section className="py-24 bg-brand-dark text-white text-center space-y-10 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-light to-transparent"></div>
        <h2 className="text-5xl font-black tracking-tight relative z-10">Experience the Future of Management</h2>
        <p className="text-brand-pale/70 text-xl max-w-2xl mx-auto leading-relaxed relative z-10 font-medium">
          Don’t let administrative tasks hold you back. Let MemberShip Pro handle the heavy lifting while you focus on what truly matters.
        </p>
        <div className="relative z-10 pt-6">
          <Link
            to="/register"
            className="bg-brand-medium text-white px-10 py-5 rounded-full font-bold text-xl hover:bg-brand-light transition-all shadow-2xl hover:shadow-brand-medium/30"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      <GuestFooter />
    </div>
  );
};

export default PlatformFeatures;