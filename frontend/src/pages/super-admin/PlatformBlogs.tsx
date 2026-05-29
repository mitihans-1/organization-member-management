import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Blog } from '../../types';

const PlatformBlogs: React.FC = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Blog | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'published',
    category: 'general',
  });

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['platform-blogs'],
    queryFn: () => api.get('/blogs').then((r) => r.data),
  });

  const platformBlogs = useMemo(
    () => (blogs || []).filter((b: any) => b.isPredefined),
    [blogs]
  );

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      api.post('/blogs', { ...payload, isPredefined: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-blogs'] });
      setOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      api.put(`/blogs/${payload.id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-blogs'] });
      setOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-blogs'] });
      alert('Blog deleted successfully!');
    },
    onError: (error: any) => {
      console.error('Error deleting blog:', error);
      alert(error.response?.data?.message || 'Failed to delete blog.');
    }
  });

  const handleDeleteBlog = (id: string) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      deleteMutation.mutate(id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', content: '', status: 'published', category: 'general' });
    setOpen(true);
  };

  const openEdit = (b: Blog) => {
    setEditing(b);
    setForm({
      title: b.title,
      content: b.content,
      status: b.status || 'published',
      category: b.category || 'general',
    });
    setOpen(true);
  };

  const submit = () => {
    const payload = { ...form };
    if (editing) updateMutation.mutate({ ...payload, id: editing.id });
    else createMutation.mutate(payload);
  };

  return (
    <div className="max-w-5xl space-y-6 font-poppins">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Blogs</h1>
          <p className="text-sm text-slate-500">
            blogs shown to org admins/guests (controlled by Super Admin).
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
        >
          New Blog
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-slate-500">Loading…</div>
        ) : platformBlogs.length === 0 ? (
          <div className="p-8 text-slate-500">No platform blogs yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {platformBlogs.map((b) => (
              <div key={b.id} className="p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {b.status} • {b.category}
                  </p>
                  <p className="text-sm text-slate-700 mt-3 line-clamp-2 whitespace-pre-wrap">
                    {b.content}
                  </p>
                </div>
                <div className="shrink-0 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(b)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBlog(b.id)}
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
              {editing ? 'Edit platform blog' : 'Create platform blog'}
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Content</label>
              <textarea
                rows={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>
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

export default PlatformBlogs;

