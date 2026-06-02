import React, { useEffect, useState, useMemo } from 'react';
import { Download, FolderOpen, FileText, PlusCircle, UploadCloud, Pencil, Trash2, X } from 'lucide-react';
import OrgAdminPageHeader from '../../components/org-admin/OrgAdminPageHeader';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface OrganizationResource {
  id: string;
  name: string;
  description?: string;
  category?: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedByName?: string;
  createdAt: string;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  let value = bytes;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(1)} ${units[index]}`;
};

const backendBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const OrgResources: React.FC = () => {
  const { user } = useAuth();
  const isOrgAdmin = user?.role === 'orgAdmin';
  const [resources, setResources] = useState<OrganizationResource[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('policy');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<OrganizationResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('policy');
  const [editFile, setEditFile] = useState<File | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<OrganizationResource[]>('/organizations/me/resources');
      setResources(response.data);
    } catch (error) {
      console.error('Failed to fetch resources', error);
      setMessage({ type: 'error', text: 'Could not load resources. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    setFile(event.target.files?.[0] || null);
  };

  const getDownloadUrl = (resource: OrganizationResource) => {
    return `${backendBaseUrl}/${resource.filePath}`;
  };

  const openEditModal = (resource: OrganizationResource) => {
    setEditingResource(resource);
    setEditTitle(resource.name);
    setEditDescription(resource.description || '');
    setEditCategory(resource.category || 'file');
    setEditFile(null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingResource(null);
    setEditTitle('');
    setEditDescription('');
    setEditCategory('policy');
    setEditFile(null);
    setIsEditModalOpen(false);
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditFile(event.target.files?.[0] || null);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) {
      return;
    }

    try {
      setIsSaving(true);
      await api.delete(`/organizations/me/resources/${resourceId}`);
      setResources((current) => current.filter((resource) => resource.id !== resourceId));
      setMessage({ type: 'success', text: 'Resource deleted successfully.' });
    } catch (error) {
      console.error('Delete failed', error);
      setMessage({ type: 'error', text: 'Failed to delete resource. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateResource = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingResource) return;

    try {
      setIsSaving(true);
      setMessage(null);
      const formData = new FormData();
      formData.append('title', editTitle || editingResource.name);
      formData.append('description', editDescription);
      formData.append('category', editCategory);
      if (editFile) {
        formData.append('file', editFile);
      }

      const response = await api.put<OrganizationResource>(`/organizations/me/resources/${editingResource.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResources((current) => current.map((resource) => (resource.id === response.data.id ? response.data : resource)));
      setMessage({ type: 'success', text: 'Resource updated successfully.' });
      closeEditModal();
    } catch (error) {
      console.error('Update failed', error);
      setMessage({ type: 'error', text: 'Failed to update resource. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description);
      formData.append('category', category);

      const response = await api.post<OrganizationResource>('/organizations/me/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResources((current) => [response.data, ...current]);
      setTitle('');
      setDescription('');
      setCategory('policy');
      setFile(null);
      setMessage({ type: 'success', text: 'Resource uploaded successfully.' });
    } catch (error) {
      console.error('Upload failed', error);
      setMessage({ type: 'error', text: 'Failed to upload resource. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-poppins">
      <OrgAdminPageHeader
        title="Resources & File Sharing"
        subtitle="Upload policies, guidelines, images, and files for your members to view and download."
      />

      {message && (
        <div className={`rounded-2xl border p-4 text-sm ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <UploadCloud className="h-5 w-5 text-indigo-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload new resource</h2>
            <p className="text-sm text-slate-500">Add files your organization members can access.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title or description"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="policy">Policy</option>
                <option value="guideline">Guideline</option>
                <option value="image">Image</option>
                <option value="file">Other file</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Optional details about the file"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Select file</label>
            <input
              type="file"
              accept="*"
              onChange={handleFileChange}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Maximum file size is 10 MB.</p>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" />
              {isSaving ? 'Uploading...' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <FolderOpen className="h-5 w-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your organization resources</h2>
            <p className="text-sm text-slate-500">Members will be able to view and download these files.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No resources uploaded yet.</div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="rounded-3xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <a
                        href={getDownloadUrl(resource)}
                        download={resource.fileName}
                        className="text-base font-semibold text-slate-900 hover:text-indigo-600"
                      >
                        {resource.name}
                      </a>
                      <p className="text-sm text-slate-500">{resource.fileName}</p>
                    </div>
                  </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={getDownloadUrl(resource)}
                    download={resource.fileName}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>

                  {isOrgAdmin && (
                    <div className="inline-flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(resource)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                  <div className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">Added on:</span> {new Date(resource.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {resource.description && (
                  <p className="mt-4 text-sm leading-6 text-slate-600">{resource.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {isEditModalOpen && editingResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Resource</h3>
                <p className="text-sm text-slate-500">Update the file metadata or replace the uploaded document.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form className="space-y-5 p-6" onSubmit={handleUpdateResource}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="policy">Policy</option>
                  <option value="guideline">Guideline</option>
                  <option value="image">Image</option>
                  <option value="file">Other file</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Optional details about the file"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Replace file</label>
                <input
                  type="file"
                  accept="*"
                  onChange={handleEditFileChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-2 text-sm text-slate-500">Leave blank to keep the current file.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgResources;
