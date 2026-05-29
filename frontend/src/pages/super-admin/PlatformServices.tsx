import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Service } from '../../types';

const PlatformServices: React.FC = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    status: 'Active',
    code: '',
    owner: '',
    department: '',
  });

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['platform-services-admin'],
    queryFn: () => api.get('/services').then((r) => r.data),
  });

  const platformServices = useMemo(
    () => (services || []).filter((s: any) => s.isPredefined),
    [services]
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/services', { ...payload, isPredefined: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-services-admin'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/services/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-services-admin'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-services-admin'] });
      alert('Service deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting service:', error);
      alert(error.response?.data?.message || 'Failed to delete service.');
    }
  });

  const handleDeleteService = (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      category: 'general',
      status: 'Active',
      code: '',
      owner: '',
      department: '',
    });
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description,
      category: s.category || 'general',
      status: s.status || 'Active',
      code: (s as any).code || '',
      owner: (s as any).owner || '',
      department: (s as any).department || '',
    });
    setOpen(true);
  };

  const submit = () => {
    if (editing) updateMutation.mutate({ ...form, id: editing.id });
    else createMutation.mutate(form);
  };

  return (
    <div className="max-w-5xl space-y-6 font-poppins">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Services</h1>
          <p className="text-sm text-slate-500">
            services shown to org admins/guests (controlled by Super Admin).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          New Service
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-slate-500">Loading…</div>
        ) : platformServices.length === 0 ? (
          <div className="p-8 text-slate-500">No platform services yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {platformServices.map((s) => (
              <div key={s.id} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.status} • {s.category}
                  </p>
                  <p className="text-sm text-slate-700 mt-3 line-clamp-2 whitespace-pre-wrap">
                    {s.description}
                  </p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id)}
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
              {editing ? 'Edit platform service' : 'Create platform service'}
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Code</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
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

export default PlatformServices;

