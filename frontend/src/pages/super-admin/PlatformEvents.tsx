import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Event } from '../../types';

const PlatformEvents: React.FC = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Event | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    status: 'upcoming',
    category: 'general',
    organizer: 'OMMS Team',
    visibility: 'public',
  });

  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['platform-events'],
    queryFn: () => api.get('/events').then((r) => r.data),
  });

  const platformEvents = useMemo(
    () => (events || []).filter((e: any) => e.isPredefined),
    [events]
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/events', { ...payload, isPredefined: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-events'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/events/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-events'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-events'] });
      alert('Event deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting event:', error);
      alert(error.response?.data?.message || 'Failed to delete event.');
    }
  });

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      date: '',
      location: '',
      status: 'upcoming',
      category: 'general',
      organizer: 'OMMS Team',
      visibility: 'public',
    });
    setOpen(true);
  };

  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description,
      date: new Date(e.date).toISOString().split('T')[0],
      location: e.location || '',
      status: e.status || 'upcoming',
      category: e.category || 'general',
      organizer: (e as any).organizer || 'OMMS Team',
      visibility: (e as any).visibility || 'public',
    });
    setOpen(true);
  };

  const submit = () => {
    const payload: any = {
      ...form,
      date: form.date,
    };
    if (editing) updateMutation.mutate({ ...payload, id: editing.id });
    else createMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl space-y-6 font-poppins">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Events</h1>
          <p className="text-sm text-slate-500">
            events shown to org admins/guests (controlled by Super Admin).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          New Event
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-slate-500">Loading…</div>
        ) : platformEvents.length === 0 ? (
          <div className="p-8 text-slate-500">No platform events yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {platformEvents.map((e) => (
              <div key={e.id} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{e.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(e.date).toLocaleDateString()} • {e.status} • {e.category}
                  </p>
                  <p className="text-sm text-slate-700 mt-3 line-clamp-2 whitespace-pre-wrap">
                    {e.description}
                  </p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(e.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">
              {editing ? 'Edit platform event' : 'Create platform event'}
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.title}
                onChange={(ev) => setForm({ ...form, title: ev.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.description}
                onChange={(ev) => setForm({ ...form, description: ev.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.date}
                  onChange={(ev) => setForm({ ...form, date: ev.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.location}
                  onChange={(ev) => setForm({ ...form, location: ev.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.status}
                  onChange={(ev) => setForm({ ...form, status: ev.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.category}
                  onChange={(ev) => setForm({ ...form, category: ev.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organizer</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.organizer}
                onChange={(ev) => setForm({ ...form, organizer: ev.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visibility</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.visibility}
                onChange={(ev) => setForm({ ...form, visibility: ev.target.value })}
              >
                <option value="public">Public (Visible to everyone)</option>
                <option value="private">Private (Only members)</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditing(null);
                }}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformEvents;

