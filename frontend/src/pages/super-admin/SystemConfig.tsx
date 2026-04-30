import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

type SystemConfig = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  telebirrPhone: string;
  cbeBirrPhone: string;
  paymentInstructions: string;
  contactPhone: string;
  contactAddress: string;
  contactEmail: string;
  contactHours: string;
  showLiveChat: boolean;
  liveChatUrl: string;
  facebookUrl: string;
  telegramUrl: string;
  linkedinUrl: string;
};

const SystemConfigPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'payment' | 'contact' | 'general'>('payment');
  
  const { data, isLoading } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => api.get<SystemConfig>('/admin/system-config').then((r) => r.data),
  });

  const [formData, setFormData] = useState<SystemConfig>({
    platformName: '',
    supportEmail: '',
    maintenanceMode: false,
    telebirrPhone: '',
    cbeBirrPhone: '',
    paymentInstructions: '',
    contactPhone: '',
    contactAddress: '',
    contactEmail: '',
    contactHours: '',
    showLiveChat: false,
    liveChatUrl: '',
    facebookUrl: '',
    telegramUrl: '',
    linkedinUrl: '',
  });
  
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setFormData({
        platformName: data.platformName || '',
        supportEmail: data.supportEmail || '',
        maintenanceMode: data.maintenanceMode || false,
        telebirrPhone: data.telebirrPhone || '',
        cbeBirrPhone: data.cbeBirrPhone || '',
        paymentInstructions: data.paymentInstructions || '',
        contactPhone: data.contactPhone || '',
        contactAddress: data.contactAddress || '',
        contactEmail: data.contactEmail || '',
        contactHours: data.contactHours || '',
        showLiveChat: data.showLiveChat || false,
        liveChatUrl: data.liveChatUrl || '',
        facebookUrl: data.facebookUrl || '',
        telegramUrl: data.telegramUrl || '',
        linkedinUrl: data.linkedinUrl || '',
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
    <div className="max-w-4xl bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xl font-black text-slate-900">System Configuration</h2>
        <p className="text-sm text-slate-500">Manage platform-wide settings and contact information</p>
      </div>

      <div className="flex border-b border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setActiveSubTab('payment')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'payment'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Payment Info
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'contact'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          Contact Info
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('general')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === 'general'
              ? 'text-sky-600 border-sky-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          }`}
        >
          General Settings
        </button>
      </div>

      <div className="p-6">
        {message && (
          <div className="mb-6 p-3 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            {message}
          </div>
        )}

        <div className="space-y-6">
          {activeSubTab === 'payment' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Telebirr Receiving Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. +251911234567)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={formData.telebirrPhone}
                  onChange={(e) => setFormData({ ...formData, telebirrPhone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  CBE Birr Receiving Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. +251911234567)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={formData.cbeBirrPhone}
                  onChange={(e) => setFormData({ ...formData, cbeBirrPhone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Payment Instructions (Shown to users)
                </label>
                <textarea
                  placeholder="Enter instructions for users when they pay..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[120px]"
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                />
                <p className="text-xs text-slate-500 mt-1 italic">These details are shown to organizations when they upgrade their plans.</p>
              </div>
            </div>
          )}

          {activeSubTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Contact Address</label>
                <input
                  type="text"
                  value={formData.contactAddress}
                  onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Business Hours</label>
                <input
                  type="text"
                  placeholder="e.g. Mon - Fri: 8:00 AM - 5:00 PM"
                  value={formData.contactHours}
                  onChange={(e) => setFormData({ ...formData, contactHours: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Facebook URL</label>
                  <input
                    type="text"
                    placeholder="https://facebook.com/..."
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Telegram URL</label>
                  <input
                    type="text"
                    placeholder="https://t.me/..."
                    value={formData.telegramUrl}
                    onChange={(e) => setFormData({ ...formData, telegramUrl: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    placeholder="https://linkedin.com/in/..."
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-md font-bold text-slate-800 mb-3">Live Chat Widget</h4>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="showLiveChat"
                checked={formData.showLiveChat}
                onChange={(e) => setFormData({ ...formData, showLiveChat: e.target.checked })}
                className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
              />
              <label htmlFor="showLiveChat" className="text-sm font-medium text-slate-700">
                Enable Live Chat on Home Page
              </label>
            </div>
            
            {formData.showLiveChat && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Live Chat URL (e.g. Tawk.to, WhatsApp link)</label>
                <input
                  type="text"
                  placeholder="https://tawk.to/chat/..."
                  value={formData.liveChatUrl}
                  onChange={(e) => setFormData({ ...formData, liveChatUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1 italic">
                  Enter your support chat link. This can be a WhatsApp link (wa.me) or a script URL.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

          {activeSubTab === 'general' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Platform name</label>
                <input
                  type="text"
                  value={formData.platformName}
                  onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Support email</label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Maintenance mode</label>
                <select
                  title="Maintenance mode"
                  value={formData.maintenanceMode ? 'on' : 'off'}
                  onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.value === 'on' })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="off">Off (Active)</option>
                  <option value="on">On (Under Maintenance)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-8 py-3 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-500 disabled:opacity-50 shadow-md shadow-sky-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemConfigPage;
