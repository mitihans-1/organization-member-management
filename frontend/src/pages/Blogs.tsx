import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Blog } from '../types';
import { Plus, Search, Edit2, Trash2, X, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CoverImage from '../components/CoverImage';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import { relativeTime } from '../lib/relativeTime';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

/** Allowed categories — stored on the server; user picks one when creating/editing. */
const BLOG_CATEGORIES = [
  'general',
  'announcement',
  'news',
  'update',
  'tutorial',
  'event',
  'policy',
  'hr',
  'finance',
  'technical',
  'community',
  'other',
] as const;

const BLOG_STATUSES = ['draft', 'published', 'archived'] as const;

const Blogs: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image: '',
    status: 'draft',
    category: 'general',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'orgAdmin' || user?.role === 'SuperAdmin';
  useBodyScrollLock(isModalOpen);

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: () => api.get('/blogs').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newBlog: Record<string, unknown>) => api.post('/blogs', newBlog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedBlog: Record<string, unknown> & { id: number }) =>
      api.put(`/blogs/${updatedBlog.id}`, updatedBlog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/blogs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogs'] }),
  });

  const categoryOptionsForFilter = useMemo(() => {
    const fromDb = new Set<string>();
    (blogs ?? []).forEach((b) => {
      if (b.category?.trim()) fromDb.add(b.category.trim());
    });
    BLOG_CATEGORIES.forEach((c) => fromDb.add(c));
    return Array.from(fromDb).sort((a, b) => a.localeCompare(b));
  }, [blogs]);

  const filtered = useMemo(() => {
    let list = blogs ?? [];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      list = list.filter((b) => (b.status || 'draft') === statusFilter);
    }
    if (categoryFilter !== 'All') {
      list = list.filter((b) => (b.category || 'general') === categoryFilter);
    }
    return list;
  }, [blogs, searchTerm, statusFilter, categoryFilter]);

  useEffect(() => {
    const onDoc = () => setOpenActionMenuId(null);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenActionMenuId(null);
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const openModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({
        title: blog.title,
        content: blog.content,
        image: blog.image || '',
        status: blog.status || 'draft',
        category: blog.category || 'general',
      });
    } else {
      setEditingBlog(null);
      setFormData({
        title: '',
        content: '',
        image: '',
        status: 'draft',
        category: 'general',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlog(null);
    setFormData({
      title: '',
      content: '',
      image: '',
      status: 'draft',
      category: 'general',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlog) {
      updateMutation.mutate({ ...formData, id: editingBlog.id });
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

  return (
    <div className="space-y-6 font-poppins">
      <OrgAdminPageHeader
        title="Blog & Announcements"
        subtitle="Manage your organization's content"
        actions={
          isAdmin ? (
            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
            >
              <Plus size={18} />
              Create Post
            </button>
          ) : undefined
        }
      />

      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-600 font-medium shrink-0">Status:</span>
            <select
            title='status'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium bg-white min-w-0 max-w-full"
            >
              <option value="All">All</option>
              {BLOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-600 font-medium shrink-0">Category:</span>
            <select
            title='category'
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium bg-white min-w-0 max-w-full"
            >
              <option value="All">All</option>
              {categoryOptionsForFilter.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center text-gray-500">
          No posts yet. Create your first post.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((blog, index) => (
            <article
              key={blog.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row"
            >
              <div className="relative w-full sm:w-48 h-44 sm:h-auto shrink-0 bg-gray-100">
                <CoverImage
                  stored={blog.image}
                  slotIndex={index}
                  variant="blog"
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0 overflow-visible">
                <div className="flex justify-between gap-4 items-start">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{blog.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {blog.author?.name ? (
                        <span>{blog.author.name}</span>
                      ) : null}
                      {blog.createdAt ? (
                        <span>
                          {blog.author?.name ? ' · ' : ''}
                          {relativeTime(blog.createdAt)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId((prev) => (prev === blog.id ? null : blog.id));
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openActionMenuId === blog.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              openModal(blog);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Edit post
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              deleteMutation.mutate(blog.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete post
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-3 line-clamp-2 flex-1">{blog.content}</p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800 border border-sky-100 capitalize">
                    {blog.category || 'general'}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-100 capitalize">
                    {blog.status || 'draft'}
                  </span>
                  {isAdmin && (
                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(blog)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(blog.id)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-black text-gray-900">
                {editingBlog ? 'Edit Post' : 'Create Post'}
              </h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm capitalize"
                  >
                    {BLOG_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm capitalize"
                  >
                    {BLOG_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Content</label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Featured Image File
                </label>
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
                <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white">
                  {editingBlog ? 'Update' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blogs;
