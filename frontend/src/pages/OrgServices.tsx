import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Service } from '../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  List,
  Briefcase,
  Download,
  Filter,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OrgAdminPageHeader from '../components/org-admin/OrgAdminPageHeader';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const PAGE_SIZE = 6;

const OrgServices: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'orgAdmin' || user?.role === 'SuperAdmin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    owner: '',
    department: '',
    duration: '',
    requiredDocuments: '',
    eligibilityRules: '',
    image: '',
    status: 'Active',
    category: 'general',
    contactEmail: '',
    price: '',
    payment_required: false,
    isPredefined: false,
  });
  const [viewingService, setViewingService] = useState<Service | null>(null);

  const queryClient = useQueryClient();
  useBodyScrollLock(isModalOpen);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newService: any) => api.post('/services', newService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedService: any) => api.put(`/services/${updatedService.id}`, updatedService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const filtered = useMemo(() => {
    const list = services ?? [];
    const q = searchTerm.trim().toLowerCase();
    return list.filter((s) => {
      const textMatch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));
      return textMatch;
    });
  }, [services, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      const docs = (service as any).requiredDocuments;
      setFormData({
        title: service.title,
        code: (service as any).code || '',
        description: service.description,
        owner: (service as any).owner || '',
        department: (service as any).department || '',
        duration: (service as any).duration || '',
        requiredDocuments: Array.isArray(docs) ? docs.join(', ') : (docs || ''),
        eligibilityRules: (service as any).eligibilityRules || '',
        image: service.image || '',
        status: service.status || 'Active',
        category: service.category || 'general',
        contactEmail: service.contactEmail || '',
        price: service.price !== undefined && service.price !== null ? String(service.price) : '',
        payment_required: (service as any).payment_required || false,
        isPredefined: (service as any).isPredefined || false,
      });
    } else {
      setEditingService(null);
      setFormData({ title: '', code: '', description: '', owner: '', department: '', duration: '', requiredDocuments: '', eligibilityRules: '', image: '', status: 'Active', category: 'general', contactEmail: '', price: '', payment_required: false, isPredefined: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({ title: '', code: '', description: '', owner: '', department: '', duration: '', requiredDocuments: '', eligibilityRules: '', image: '', status: 'Active', category: 'general', contactEmail: '', price: '', payment_required: false, isPredefined: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...formData };
    if (formData.payment_required && formData.price) {
      payload.price = parseFloat(formData.price);
    } else {
      payload.price = null;
      payload.payment_required = false;
    }
    if (editingService) {
      updateMutation.mutate({ ...payload, id: editingService.id });
    } else {
      createMutation.mutate(payload);
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
    const rows = filtered.map((service) => ({
      Title: service.title,
      Description: service.description || '',
      Image: service.image || '',
    }));
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0] || {});
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
    link.download = `services-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const listBody = (
    <>
      <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="relative flex-1 min-w-0 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search services..."
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
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400">Loading services...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Subscribers</th>
                  <th className="px-4 py-3 w-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                      No services found
                    </td>
                  </tr>
                ) : (
                  paged.map((service) => {
                    return (
                      <tr key={service.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <div>
                              <p 
                                className="font-bold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => setViewingService(service)}
                                title="Click to view full details"
                              >
                                {service.title}
                              </p>
                              {service.description ? (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{service.description}</p>
                              ) : null}
                            </div>
                            {(service as any).isPredefined && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-0.5 text-[10px] font-semibold">
                                Platform
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold border ${
                            service.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' :
                            service.status === 'Suspended' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            service.status === 'Archived' ? 'bg-gray-50 text-gray-700 border-gray-100' :
                            service.status === 'Under Maintenance' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-sky-50 text-sky-700 border-sky-100'
                          }`}>
                            {service.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-gray-700">{service._count?.subscribers || 0}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 justify-end relative">
                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={() => openModal(service)}
                                  className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => deleteMutation.mutate(service.id)}
                                  className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId((prev) => (prev === service.id ? null : service.id))
                              }
                              className="p-2 rounded-lg hover:bg-gray-100"
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openActionMenuId === service.id && (
                              <div className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-gray-100 bg-white shadow-lg py-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    openModal(service);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Edit Service
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    deleteMutation.mutate(service.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  Delete Service
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
                of {filtered.length} services
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
        title="Service Management"
        subtitle="Create and manage organization services"
        actions={
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500"
          >
            <Plus size={18} />
            Create Service
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">{listBody}</div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900">{editingService ? 'Edit Service' : 'Create Service'}</h3>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Title</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="SVC-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Owner</label>
                  <input
                    type="text"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="Member Support"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="30 days"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Required Documents (comma-separated)</label>
                <input
                  type="text"
                  value={formData.requiredDocuments}
                  onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  placeholder="ID card, membership form"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Eligibility Rules</label>
                <textarea
                  rows={2}
                  value={formData.eligibilityRules}
                  onChange={(e) => setFormData({ ...formData, eligibilityRules: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  placeholder="Must be active member for at least 3 months"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Availability Status</label>
                <select
                  title='select services'
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Archived">Archived</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                  title="name"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm capitalize"
                  >
                    <option value="general">General</option>
                    <option value="support">Support</option>
                    <option value="training">Training</option>
                    <option value="consulting">Consulting</option>
                    <option value="membership">Membership</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="support@example.com"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.payment_required}
                    onChange={(e) => setFormData({ ...formData, payment_required: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-gray-700">Require payment to subscribe</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPredefined}
                    onChange={(e) => setFormData({ ...formData, isPredefined: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-gray-700">Predefined Platform Service</span>
                </label>
              </div>
              {formData.payment_required && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Price (ETB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={formData.payment_required}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image (URL or File)</label>
                <div className="flex flex-col gap-3">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.image.startsWith('data:') ? '' : formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">OR UPLOAD</span>
                    <input
                      key={formData.image ? 'has-img' : 'no-img'}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null)}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
                {formData.image ? (
                  <div className="mt-2 flex items-center gap-4">
                    {formData.image.startsWith('data:') ? (
                      <span className="text-xs text-green-600 font-semibold">File attached</span>
                    ) : (
                      <span className="text-xs text-blue-600 font-semibold">URL provided</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Clear Image
                    </button>
                  </div>
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
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgServices;
