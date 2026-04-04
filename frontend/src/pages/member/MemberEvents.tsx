import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Event } from '../../types';
import { Calendar, MapPin, Users, List, LayoutGrid, Download } from 'lucide-react';

type RSVP = 'yes' | 'maybe' | 'no' | null;

const FILTERS = ['All', 'Meeting', 'Volunteer', 'Fundraiser', 'Training'] as const;

const MemberEvents: React.FC = () => {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [rsvp, setRsvp] = useState<Record<number, RSVP>>({});

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((r) => r.data),
  });

  const filtered = useMemo(() => {
    if (!events?.length) return [];
    if (filter === 'All') return events;
    return events.filter((e) =>
      (e.title + (e.description || '')).toLowerCase().includes(filter.toLowerCase())
    );
  }, [events, filter]);

  const handleRsvp = (eventId: number, value: Exclude<RSVP, null>) => {
    setRsvp((prev) => ({
      ...prev,
      // Toggle off when user clicks the same RSVP again.
      [eventId]: prev[eventId] === value ? null : value,
    }));
  };

  const downloadTicket = (ev: Event) => {
    const current = rsvp[ev.id] ?? null;
    if (current !== 'yes') {
      alert('Please RSVP "yes" before downloading a ticket.');
      return;
    }

    const ticket = [
      'Organization Member Management System',
      'Event Ticket',
      '------------------------------',
      `Title: ${ev.title}`,
      `Date: ${ev.date ? new Date(ev.date).toLocaleString() : '—'}`,
      `Location: ${ev.location || 'TBA'}`,
      `RSVP: YES`,
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
    <div className="max-w-4xl space-y-6 font-poppins px-1 sm:px-0">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span aria-hidden>📅</span> Event participation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Browse events, RSVP, and manage your participation.</p>
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
            onClick={() => setView('calendar')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-l border-slate-200 ${
              view === 'calendar' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            <LayoutGrid size={16} />
            Calendar
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

      {view === 'calendar' && (
        <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6">
          Calendar view uses the same events as the list — switch to <strong>List</strong> for details and RSVP.
        </p>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <p className="text-slate-500 text-sm">No events match this filter.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((ev) => {
            const status = rsvp[ev.id] ?? null;
            return (
              <li
                key={ev.id}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h2 className="text-lg font-black text-slate-900 break-words">{ev.title}</h2>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-sky-50 text-sky-700 shrink-0">
                    Event
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                  <span className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {ev.date ? new Date(ev.date).toLocaleString() : '—'}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    {ev.location || 'TBA'}
                  </span>
                  <span className="flex items-center gap-2 sm:col-span-2">
                    <Users size={16} className="text-slate-400" />
                    Open to members
                  </span>
                </div>
                {ev.description && <p className="text-sm text-slate-700">{ev.description}</p>}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-slate-500">RSVP:</span>
                    {(['yes', 'maybe', 'no'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => handleRsvp(ev.id, k)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold capitalize min-w-[56px] ${
                          status === k
                            ? k === 'yes'
                              ? 'bg-emerald-100 text-emerald-800'
                              : k === 'maybe'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {k}
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
      )}
    </div>
  );
};

export default MemberEvents;
