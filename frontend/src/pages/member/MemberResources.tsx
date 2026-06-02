import React, { useEffect, useState } from 'react';
import { Download, FolderOpen, FileText } from 'lucide-react';
import api from '../../services/api';

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

const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const MemberResources: React.FC = () => {
  const [resources, setResources] = useState<OrganizationResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<OrganizationResource[]>('/organizations/me/resources');
      setResources(response.data);
    } catch (err) {
      console.error('Error fetching resources', err);
      setError('Unable to load resources. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getDownloadUrl = (resource: OrganizationResource) => {
    return `${baseUrl}/${resource.filePath}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 font-poppins">
      <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Organization Resources</h1>
            <p className="mt-1 text-sm text-slate-500">Download policies, guidelines, images, and shared files from your organization.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            <FolderOpen className="h-4 w-4" />
            Shared resources
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading resources...</div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No resources have been shared by your organization yet.</div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <a
                      href={getDownloadUrl(resource)}
                      download={resource.fileName}
                      className="text-lg font-semibold text-slate-900 hover:text-indigo-600"
                    >
                      {resource.name}
                    </a>
                    <p className="text-sm text-slate-500">{resource.fileName}</p>
                  </div>
                </div>

                <a
                  href={getDownloadUrl(resource)}
                  download={resource.fileName}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Category:</span> {resource.category || 'Other'}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Size:</span> {formatBytes(resource.size)}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Shared by:</span> {resource.uploadedByName || 'Organization admin'}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-semibold text-slate-700">Uploaded:</span> {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </div>

              {resource.description && (
                <p className="mt-4 text-sm leading-6 text-slate-600">{resource.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemberResources;
