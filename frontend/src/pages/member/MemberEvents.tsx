import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Event } from '../../types';
import {
  Calendar,
  MapPin,
  Users,
  List,
  LayoutGrid,
  Download,
  CreditCard,
  CheckCircle,
  User2,
  AlertCircle,
  Video,
  Globe,
  CalendarRange,
  Filter,
  Mail,
} from 'lucide-react';
import EventDetailsModal from '../../components/EventDetailsModal';
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
  EVENT_FILTER_FIELDS,
  EVENT_SEARCH_FIELDS,
  EVENT_SEARCH_GETTERS,
} from '../../utils/filterDefinitions';
import { useCardPagination } from '../../hooks/useCardPagination';
import CardPagination from '../../components/filters/CardPagination';

type RSVP = 'yes' | 'maybe' | 'no' | null;

const MemberEvents: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [rsvp, setRsvp] = useState<Record<string, RSVP>>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const registerMutation = useMutation({
    mutationFn: (eventId: string) => api.post(`/events/${eventId}/register`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      alert('Successfully registered for the event!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Error registering for event');
    }
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((r) => r.data),
  });

  const { data: userPayments, isLoading: paymentsLoading } = useQuery<any[]>({
    queryKey: ['my-payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const isLoading = eventsLoading || paymentsLoading;

  const eventFilterResolvers = useMemo(
    () => buildFilterResolvers(EVENT_FILTER_FIELDS),
    []
  );

  const filters = useMemo(() => {
    if (!events || events.length === 0) return [];
    return initializeFilters(events, EVENT_FILTER_FIELDS);
  }, [events]);

  const filtered = useMemo(() => {
    if (!events?.length) return [];
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

  const handleRsvp = (eventId: string, value: Exclude<RSVP, null>) => {
    setRsvp((prev) => ({
      ...prev,
      // Toggle off when user clicks the same RSVP again.
      [eventId]: prev[eventId] === value ? null : value,
    }));
  };

  const downloadTicket = (ev: Event) => {
    const isRegistered = !!(user && ev.attendeesIds?.includes(user.id));
    const currentStatus = isRegistered ? 'yes' : (rsvp[ev.id] ?? null);
    
    if (currentStatus !== 'yes') {
      alert('Please register or RSVP "yes" before downloading a ticket.');
      return;
    }

    const ticket = [
      'Organization Member Management System',
      'Event Ticket',
      '------------------------------',
      `Title: ${ev.title}`,
      `Date: ${ev.date ? new Date(ev.date).toLocaleString() : '—'}`,
      `Location: ${ev.location || 'TBA'}`,
      `Status: REGISTERED`,
      '',
      'Please present this ticket at check-in.',
    ].join('\n');

    const blob = new Blob([ticket], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ev.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl space-y-6 font-poppins px-1 sm:px-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span aria-hidden>📅</span> Event participation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Browse events, RSVP, and manage your participation.</p>
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
              onClick={() => setView('calendar')}
              className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-l border-slate-200 ${
                view === 'calendar' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'
              }`}
            >
              <LayoutGrid size={16} />
              Calendar
            </button>
          </div>

          {/* Mobile Filter Button */}
          {view === 'list' && (
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
          )}
        </div>
      </div>

      {/* Search Bar */}
      {view === 'list' && (
        <SearchBar
          value={searchText}
          onChange={setSearchText}
          placeholder="Search by title, location, organizer, category, status..."
        />
      )}

      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-8 items-start">
        {view === 'list' && (
          <FilterSidebar
            filters={filters}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            isMobileOpen={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
            className="lg:w-72"
          />
        )}

        <div className="flex-1 min-w-0">
          {view === 'calendar' && (
            <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
              Calendar view uses the same events as the list — switch to <strong>List</strong> for details and RSVP.
            </p>
          )}

          {view === 'list' && (
            isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            ) : !filtered.length ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <>
              <ul className="space-y-4">
                {pagedEvents.map((ev) => {
                  const isRegistered = !!(user && ev.attendeesIds?.includes(user.id));
                  const pendingPayment = userPayments?.find(
                    (p) => p.reference_type === 'event' && p.reference_id === ev.id && p.status === 'pending'
                  );
                  const status = isRegistered ? 'yes' : (rsvp[ev.id] ?? null);
                  const isPaymentRequired = !!(ev.payment_required && ev.price && ev.price > 0);

                  return (
                    <li
                      key={ev.id}
                      className={`bg-white border rounded-xl p-6 shadow-sm space-y-4 transition-all relative overflow-hidden ${
                        isRegistered ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                      }`}
                    >
                      {/* Premium Header Layout */}
                      <div className="flex items-start gap-4">
                        {/* Left Icon Block */}
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                          <Calendar size={22} strokeWidth={2} />
                        </div>

                        {/* Title & Registration Badges */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 
                              className="text-lg font-black text-slate-900 break-words cursor-pointer hover:text-sky-600 transition-colors flex items-center gap-2"
                              onClick={() => setSelectedEvent(ev)}
                            >
                              {ev.title}
                              {isRegistered && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
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
                                {ev.category || 'General'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                ev.status === 'Draft' || ev.status === 'draft' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                ev.status === 'Upcoming' || ev.status === 'upcoming' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                ev.status === 'Ongoing' || ev.status === 'ongoing' ? 'bg-green-100 text-green-800 border-green-200' :
                                ev.status === 'Completed' || ev.status === 'completed' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                'bg-red-100 text-red-800 border-red-200'
                              }`}>
                                {ev.status || 'Upcoming'}
                              </span>
                            </div>
                          </div>

                          {isRegistered ? (
                            <p className="text-xs font-bold text-emerald-600">You are registered for this event</p>
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
                          <Calendar size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Starts:</strong> {ev.date ? new Date(ev.date).toLocaleString() : '—'}</span>
                        </div>
                        {ev.end_date && (
                          <div className="flex items-center gap-2 min-w-0">
                            <CalendarRange size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Ends:</strong> {new Date(ev.end_date).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Venue:</strong> {ev.location || 'TBA'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          <User2 size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Host:</strong> {ev.organizer || 'Organization Admin'}</span>
                        </div>
                        {ev.registrationDeadline && (
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertCircle size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Deadline:</strong> {new Date(ev.registrationDeadline).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 min-w-0">
                          <Users size={15} className="text-slate-400 shrink-0" />
                          <span className="truncate"><strong>Capacity:</strong> {ev.capacity ? `${ev.capacity} seats (${Math.max(0, ev.capacity - (ev._count?.attendees || 0))} left)` : 'Unlimited'}</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                          {ev.virtualLink ? (
                            <>
                              <Video size={15} className="text-slate-400 shrink-0" />
                              <span className="truncate"><strong>Mode:</strong> Virtual Link Available</span>
                            </>
                          ) : (
                            <>
                              <Globe size={15} className="text-slate-400 shrink-0" />
                              <span className="truncate"><strong>Mode:</strong> Physical Venue</span>
                            </>
                          )}
                        </div>
                        {ev.contactEmail && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail size={15} className="text-slate-400 shrink-0" />
                            <span className="truncate"><strong>Contact:</strong> {ev.contactEmail}</span>
                          </div>
                        )}
                        {isPaymentRequired && (
                          <div className="flex items-center gap-2 min-w-0 font-bold text-slate-900 col-span-1 sm:col-span-2">
                            <CreditCard size={15} className="text-slate-400 shrink-0" />
                            <span><strong>Ticket Price:</strong> ETB {Number(ev.price).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {ev.description ? (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 text-sm text-slate-700 whitespace-pre-wrap break-words line-clamp-3">
                          {ev.description}
                        </div>
                      ) : null}

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-slate-500">RSVP:</span>
                          {(['yes', 'maybe', 'no'] as const).map((k) => (
                            <button
                              key={k}
                              type="button"
                              disabled={isRegistered || !!pendingPayment || registerMutation.isPending}
                              onClick={() => {
                                if (k === 'yes') {
                                  if (isPaymentRequired) {
                                    // FOR PAID EVENTS: Always redirect to modal/payment flow
                                    setSelectedEvent(ev);
                                  } else {
                                    // FOR FREE EVENTS: Direct registration
                                    registerMutation.mutate(ev.id);
                                  }
                                } else {
                                  handleRsvp(ev.id, k);
                                }
                              }}
                              className={`px-3 py-2 rounded-lg text-xs font-bold capitalize min-w-[56px] ${
                                status === k
                                  ? k === 'yes'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : k === 'maybe'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              } ${(isRegistered || !!pendingPayment) ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {k === 'yes' ? (
                                isRegistered ? 'Paid' : (pendingPayment ? 'Pending' : (isPaymentRequired ? 'Pay & RSVP' : 'Register'))
                              ) : k}
                            </button>
                          ))}
                          {status && (
                            <span className="text-xs text-slate-500 ml-1">
                              Selected: <span className="font-semibold capitalize">{status}</span>
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadTicket(ev)}
                          disabled={status !== 'yes'}
                          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700 hover:bg-sky-100"
                        >
                          <Download size={16} />
                          {status === 'yes' ? 'Download ticket' : 'RSVP yes to download'}
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
                itemLabel="events"
              />
              </>
            )
          )}
        </div>
      </div>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          events={events}
          onClose={() => setSelectedEvent(null)}
          showRegisterActions={true}
        />
      )}
    </div>
  );
};

export default MemberEvents;
