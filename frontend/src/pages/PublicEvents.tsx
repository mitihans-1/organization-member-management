import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Event } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  X,
  Filter,
  User2,
  AlertCircle,
  Video,
  Globe,
  Sliders,
  CalendarRange,
  Mail,
} from 'lucide-react';
import GuestNavbar from '../components/GuestNavbar';
import GuestFooter from '../components/GuestFooter';
import CoverImage from '../components/CoverImage';
import EventDetailsModal from '../components/EventDetailsModal';
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
  EVENT_FILTER_FIELDS,
  EVENT_SEARCH_FIELDS,
  EVENT_SEARCH_GETTERS,
} from '../utils/filterDefinitions';
import { useCardPagination } from '../hooks/useCardPagination';
import CardPagination from '../components/filters/CardPagination';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDateOnly(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function timeRangeFromEvent(startIso: string, endIso?: string) {
  const start = new Date(startIso);
  if (endIso) {
    const end = new Date(endIso);
    return `${formatTime(start)} - ${formatTime(end)}`;
  }
  return formatTime(start);
}

function attendeeLabel(count?: number) {
  return `${count || 0} attendees`;
}

const HOST_CHECKLIST = [
  'Easy online registration and ticketing',
  'Automated reminders and follow-ups',
  'Real-time attendance tracking',
  'Integrated member communication',
  'Post-event analytics and reporting',
];

const PublicEvents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['public-events'],
    queryFn: () => api.get('/events').then((res) => res.data),
  });

  const eventFilterResolvers = useMemo(
    () => buildFilterResolvers(EVENT_FILTER_FIELDS),
    []
  );

  const filters = useMemo(() => {
    if (!events || events.length === 0) return [];
    return initializeFilters(events, EVENT_FILTER_FIELDS);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return filterItems(
      events,
      searchText,
      selectedFilters,
      EVENT_SEARCH_FIELDS,
      eventFilterResolvers,
      EVENT_SEARCH_GETTERS
    );
  }, [events, searchText, selectedFilters, eventFilterResolvers]);

  const paginationResetKey = `${searchText}|${JSON.stringify(selectedFilters)}`;
  const {
    pagedItems: pagedEvents,
    currentPage,
    totalPages,
    setPage,
    totalItems,
    pageSize,
  } = useCardPagination(filteredEvents, 4, paginationResetKey);

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
            Upcoming Events
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
            Join our community for these exclusive events
          </p>
        </div>

        <div className="mb-8 max-w-2xl mx-auto">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by title, location, organizer, category, status..."
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
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl shadow-md border border-gray-100/80 h-[520px] animate-pulse"
                  />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState
                title="No events found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            ) : (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pagedEvents.map((event, index) => (
                  <article
                    key={event.id}
                    className="bg-white rounded-2xl shadow-md shadow-gray-200/60 border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300"
                  >
                    <div 
                      className="relative h-52 sm:h-56 bg-brand-pale/20 shrink-0 cursor-pointer overflow-hidden group"
                      onClick={() => user ? setSelectedEvent(event) : (event.organizationId ? navigate(`/register?org=${event.organizationId}`) : navigate('/register'))}
                    >
                      <CoverImage
                        stored={event.image}
                        slotIndex={(currentPage - 1) * pageSize + index}
                        variant="event"
                        alt=""
                        className="w-full h-full object-cover min-h-[13rem] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6 flex-1 flex flex-col gap-4">
                      {/* Premium Title Header Block */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                          <Calendar size={20} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 
                            className="text-lg font-bold text-brand-dark leading-snug cursor-pointer hover:text-brand-medium transition-colors break-words"
                            onClick={() => user ? setSelectedEvent(event) : (event.organizationId ? navigate(`/register?org=${event.organizationId}`) : navigate('/register'))}
                            title="Click to view full details"
                          >
                            {event.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {event.payment_required ? (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                Paid
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                Free
                              </span>
                            )}
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 capitalize">
                              {event.category || 'General'}
                            </span>
                            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 capitalize">
                              {event.status || 'Upcoming'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Extended Properties Grid (Unique to Events) */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs text-gray-600 bg-gray-50/50 p-3.5 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0">
                          <Calendar size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Starts:</strong> {formatDateOnly(event.date)}</span>
                        </div>
                        {event.end_date && (
                          <div className="flex items-center gap-2 min-w-0">
                            <CalendarRange size={14} className="text-brand-medium shrink-0" />
                            <span className="truncate"><strong>Ends:</strong> {formatDateOnly(event.end_date)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Time:</strong> {timeRangeFromEvent(event.date, event.end_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Venue:</strong> {event.location?.trim() || 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <User2 size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Host:</strong> {event.organizer || 'Admin'}</span>
                        </div>
                        {event.registrationDeadline && (
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle size={14} className="text-brand-medium shrink-0" />
                            <span className="truncate"><strong>Deadline:</strong> {formatDateOnly(event.registrationDeadline)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <Users size={14} className="text-brand-medium shrink-0" />
                          <span className="truncate"><strong>Capacity:</strong> {event.capacity ? `${event.capacity} seats (${Math.max(0, event.capacity - (event._count?.attendees || 0))} left)` : 'Unlimited'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          {event.virtualLink ? (
                            <>
                              <Video size={14} className="text-brand-medium shrink-0" />
                              <span className="truncate"><strong>Mode:</strong> Virtual</span>
                            </>
                          ) : (
                            <>
                              <Globe size={14} className="text-brand-medium shrink-0" />
                              <span className="truncate"><strong>Mode:</strong> Physical</span>
                            </>
                          )}
                        </div>
                        {event.contactEmail && (
                          <div className="flex items-center gap-2 min-w-0 col-span-2">
                            <Mail size={14} className="text-brand-medium shrink-0" />
                            <span className="truncate"><strong>Contact:</strong> {event.contactEmail}</span>
                          </div>
                        )}
                      </div>

                      {event.description ? (
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-6 flex-1 whitespace-pre-wrap break-words border-l-2 border-brand-medium/30 pl-3">
                          {event.description}
                        </p>
                      ) : (
                        <div className="mb-6 flex-1" />
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (user) {
                            setSelectedEvent(event);
                          } else {
                            if (event.organizationId) {
                              navigate(`/register?org=${event.organizationId}`);
                            } else {
                              navigate(`/register`);
                            }
                          }
                        }}
                        className="w-full py-3 rounded-xl bg-brand-medium text-white font-bold text-sm hover:bg-brand-light transition-colors shadow-md shadow-brand-medium/25"
                      >
                        {user ? 'View Details' : 'Register Now'}
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
                itemLabel="events"
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
                Want to Host Your Own Event?
              </h2>
              <p className="text-gray-600 leading-relaxed mb-8 text-[15px] sm:text-base">
                Partner with us to reach your members and run polished events from promotion to follow-up—all in one place.
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

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          events={events}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default PublicEvents;