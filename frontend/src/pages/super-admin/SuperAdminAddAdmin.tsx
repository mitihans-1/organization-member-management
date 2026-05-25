import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Plan } from '../../types';

interface Organization {
  id: string;
  name: string;
  type: string;
}

const SuperAdminAddAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization_id: '',
    plan_id: '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((res) => res.data),
  });

  const { data: organizations } = useQuery<Organization[]>({
    queryKey: ['admin', 'organizations', 'all'],
    queryFn: () => api.get('/admin/organizations/all').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof formData) => api.post('/admin/org-admins', payload),
    onSuccess: () => {
      setMessage('Admin created successfully.');
      setTimeout(() => navigate('/super-admin/org-admins'), 700);
    },
    onError: () => {
      setMessage('Failed to create admin. Please check your input.');
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Add Organization Admin</h1>
        <p className="text-sm text-slate-500">Add an admin to an existing organization</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700">Admin name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Admin email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Initial password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Select Organization</label>
          <select
          title="name"
            required
            value={formData.organization_id}
            onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select an organization</option>
            {organizations?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700">Initial plan (optional)</label>
          <select
          title="name"
            value={formData.plan_id}
            onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a plan</option>
            {plans?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - ${p.price}
              </option>
            ))}
          </select>
        </div>

        {message ? <p className="text-sm font-semibold text-slate-700">{message}</p> : null}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/super-admin/org-admins')}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-500 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Admin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperAdminAddAdmin;

