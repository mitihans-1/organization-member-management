import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

type SystemConfig = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  telebirrPhone: string;
};

const SystemConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => api.get<SystemConfig>('/admin/system-config').then((r) => r.data),
  });

  const [formData, setFormData] = useState<SystemConfig>({
    platformName: '',
    supportEmail: '',
    maintenanceMode: false,
    telebirrPhone: '',
  });
  
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setFormData({
        platformName: data.platformName || '',
        supportEmail: data.supportEmail || '',
        maintenanceMode: data.maintenanceMode || false,
        telebirrPhone: data.telebirrPhone || '',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: SystemConfig) =>
      api.put<SystemConfig>('/admin/system-config', payload).then((r) => r.data),
    onSuccess: (saved) => {
      setFormData(saved);
      queryClient.invalidateQueries({ queryKey: ['systemConfig'] });
      setMessage('Saved successfully.');
      window.setTimeout(() => setMessage(null), 2500);
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading config…</div>;

  return (
    <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-xl font-black text-slate-900 mb-6">System Configuration</h2>

      {message && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg">
          {message}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Platform name</label>
          <input
            type="text"
            value={formData.platformName}
            onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Support email</label>
          <input
            type="email"
            value={formData.supportEmail}
            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Telebirr / CBE Receiving Phone
          </label>
          <input
            type="text"
            placeholder="e.g. +251911234567"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={formData.telebirrPhone}
            onChange={(e) => setFormData({ ...formData, telebirrPhone: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">This number is shown to users when they choose to pay via Telebirr or CBE Birr.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Maintenance mode</label>
          <select
            value={formData.maintenanceMode ? 'on' : 'off'}
            onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.value === 'on' })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="off">Off (Active)</option>
            <option value="on">On (Under Maintenance)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-500 disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
