import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Blog } from '../types';
import { Plus, Search, BookOpen, User, Calendar, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CoverImage from '../components/CoverImage';

const Blogs: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', image: '' });

  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'organAdmin' || user?.role === 'SuperAdmin';

  const { data: blogs, isLoading } = useQuery<Blog[]>({
    queryKey: ['blogs'],
    queryFn: () => api.get('/blogs').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newBlog: any) => api.post('/blogs', newBlog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedBlog: any) => api.put(`/blogs/${updatedBlog.id}`, updatedBlog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  const openModal = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({ title: blog.title, content: blog.content, image: blog.image || '' });
    } else {
      setEditingBlog(null);
      setFormData({ title: '', content: '', image: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBlog(null);
    setFormData({ title: '', content: '', image: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBlog) {
      updateMutation.mutate({ ...formData, id: editingBlog.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-brand-dark tracking-tight">Blogs</h1>
        {isAdmin && (
          <button
            onClick={() => openModal()}
            className="bg-brand-medium text-white px-5 py-2.5 rounded-2xl flex items-center space-x-2 hover:bg-brand-light transition-all shadow-lg shadow-brand-medium/20 font-bold"
          >
            <Plus size={20} />
            <span>Add Blog</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2rem]"></div>)}
        </div>
      ) : blogs?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-brand-pale/50">
           <BookOpen className="mx-auto text-brand-pale mb-4" size={64} />
           <p className="text-brand-deep font-bold text-lg">No blogs found. Start by writing one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs?.map((blog, index) => (
            <div key={blog.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden min-h-[12rem]">
                <CoverImage
                  stored={blog.image}
                  slotIndex={index}
                  variant="blog"
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {isAdmin && (
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Edit blog" onClick={() => openModal(blog)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:text-brand-medium transition-colors"><Edit2 size={16} /></button>
                    <button title="Delete blog" onClick={() => deleteMutation.mutate(blog.id)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-brand-dark mb-3 group-hover:text-brand-medium transition-colors leading-tight">{blog.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-6 font-medium leading-relaxed">{blog.content}</p>
                <div className="space-y-2 mt-auto">
                  <div className="flex items-center text-[10px] font-black text-brand-deep uppercase tracking-widest space-x-2">
                    <Calendar size={14} className="text-brand-medium" />
                    <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-brand-dark tracking-tight">{editingBlog ? 'Edit Blog Post' : 'Create New Post'}</h3>
              <button onClick={closeModal} title="Close" className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-brand-dark"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium"
                  placeholder="Enter a catchy title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Content</label>
                <textarea
                  required
                  rows={8}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium leading-relaxed"
                  placeholder="Share your thoughts with the community..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-brand-deep uppercase tracking-widest ml-1">Featured Image URL</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full border-2 border-gray-50 bg-gray-50 rounded-2xl px-6 py-3.5 focus:border-brand-medium focus:ring-0 transition-all font-medium text-sm"
                  placeholder="https://example.com/blog-image.jpg"
                />
              </div>
              <div className="pt-6 flex space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-4 border-2 border-gray-50 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 hover:text-brand-dark transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-brand-medium text-white rounded-2xl font-black hover:bg-brand-light transition-all shadow-xl shadow-brand-medium/20"
                >
                  {editingBlog ? 'Update Post' : 'Publish Blog'}
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
