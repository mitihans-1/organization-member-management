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

  return (
    <div className="max-w-4xl space-y-6 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span aria-hidden>📅</span> Event participation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Browse events, RSVP, and manage your participation.</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
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

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
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
                <div className="flex justify-between gap-4">
                  <h2 className="text-lg font-black text-slate-900">{ev.title}</h2>
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
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">RSVP:</span>
                    {(['yes', 'maybe', 'no'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setRsvp((s) => ({ ...s, [ev.id]: k }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
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
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-bold text-sky-600"
                  >
                    <Download size={16} />
                    Download ticket
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
