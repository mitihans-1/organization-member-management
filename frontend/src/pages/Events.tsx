import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Event } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  List,
  Calendar as CalendarIcon,
  Download,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const PAGE_SIZE = 6;

const Events: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'orgAdmin' || user?.role === 'SuperAdmin';
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image: '',
    status: 'draft',
  });

  const queryClient = useQueryClient();
  useBodyScrollLock(isModalOpen);

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newEvent: any) => api.post('/events', newEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedEvent: any) => api.put(`/events/${updatedEvent.id}`, updatedEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const filtered = useMemo(() => {
    const list = events ?? [];
    const q = searchTerm.trim().toLowerCase();
    const locationQ = locationFilter.trim().toLowerCase();
    return list.filter((e) => {
      const textMatch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q));

      const locationMatch = !locationQ || (e.location || '').toLowerCase().includes(locationQ);

      const eventDate = new Date(e.date);
      const startMatch = !startDateFilter || eventDate >= new Date(`${startDateFilter}T00:00:00`);
      const endMatch = !endDateFilter || eventDate <= new Date(`${endDateFilter}T23:59:59`);

      return textMatch && locationMatch && startMatch && endMatch;
    });
  }, [events, searchTerm, locationFilter, startDateFilter, endDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  const openModal = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        date: new Date(event.date).toISOString().split('T')[0],
        location: event.location || '',
        image: event.image || '',
        status: event.status || 'draft',
      });
    } else {
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', image: '', status: 'draft' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', date: '', location: '', image: '', status: 'draft' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      updateMutation.mutate({ ...formData, id: editingEvent.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImageFileChange = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const exportToCsv = () => {
    const rows = filtered.map((event) => ({
      Title: event.title,
      Description: event.description || '',
      Date: new Date(event.date).toISOString(),
      Location: event.location || '',
      Image: event.image || '',
    }));
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => `"${String((row as Record<string, string>)[h]).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const listBody = (
    <>
      <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50 w-fit">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
              view === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <List size={16} />
            List View
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold ${
              view === 'calendar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            <CalendarIcon size={16} />
            Calendar View
          </button>
        </div>
        <div className="flex flex-1 flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportToCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 w-full sm:w-auto justify-center"
            >
              <Download size={16} />
              Export
            </button>
            <button
              type="button"
              onClick={() => setIsFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 w-full sm:w-auto justify-center"
            >
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>
      </div>
      {isFilterOpen && (
        <div className="px-4 md:px-5 pb-4 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Filter by location"
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setStartDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            />
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setEndDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setLocationFilter('');
                setStartDateFilter('');
                setEndDateFilter('');
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {view === 'calendar' ? (
        <div className="p-10 text-center text-gray-500 text-sm">
          Calendar view: switch to <strong>List View</strong> for full table management. (Connect a calendar
          component here later.)
        </div>
      ) : isLoading ? (
        <div className="p-12 text-center text-gray-400">Loading events...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date &amp; Time</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      No events found
                    </td>
                  </tr>
                ) : (
                  paged.map((event) => {
                    return (
                      <tr key={event.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-4">
                          <p className="font-bold text-gray-900">{event.title}</p>
                          {event.description ? (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{event.description}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-gray-700 whitespace-nowrap font-mono text-xs">
                          {new Date(event.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-gray-700">{event.location || '—'}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-full bg-sky-50 px-3 py-0.5 text-xs font-semibold text-sky-700 border border-sky-100 capitalize">
                            {event.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 justify-end relative">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={() => openModal(event)}
                                  className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => deleteMutation.mutate(event.id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId((prev) => (prev === event.id ? null : event.id))
                              }
                              className="p-2 rounded-lg hover:bg-gray-100"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openActionMenuId === event.id && (
                              <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-gray-100 bg-white shadow-lg py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    openModal(event);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Edit Event
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    deleteMutation.mutate(event.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete Event
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
              <p>
                Showing {(pageSafe - 1) * PAGE_SIZE + 1} to {Math.min(pageSafe * PAGE_SIZE, filtered.length)}{' '}
                of {filtered.length} events
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[36px] py-1.5 rounded-lg border text-sm font-bold ${
                      pageSafe === n
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  return (
    <div className="space-y-0 font-poppins">
      <OrgAdminPageHeader
        title="Event Management"
        subtitle="Create and manage organization events"
        actions={
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus size={18} />
            Create Event
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">{listBody}</div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
                {formData.image ? (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                  >
                    Remove selected image
                  </button>
                ) : null}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 py-3 font-bold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
