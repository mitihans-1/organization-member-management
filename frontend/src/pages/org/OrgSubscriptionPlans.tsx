
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MemberSubscriptionPlan } from '../../types';

const OrgSubscriptionPlans: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MemberSubscriptionPlan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'ETB',
    billingCycle: 'monthly' as const,
    durationDays: 30,
    trialDays: '',
    features: [''],
    maxMembers: '',
    isActive: true,
    sortOrder: 0,
  });

  const { data: plans, isLoading } = useQuery<MemberSubscriptionPlan[]>({
    queryKey: ['orgSubscriptionPlans'],
    queryFn: () =>
      api.get(`/member-subscription-plans/organizations/${user?.organizationId}`).then((r) => r.data),
    enabled: !!user?.organizationId,
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) =>
      api.post(`/member-subscription-plans/organizations/${user?.organizationId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptionPlans'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/member-subscription-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptionPlans'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/member-subscription-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgSubscriptionPlans'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'ETB',
      billingCycle: 'monthly',
      durationDays: 30,
      trialDays: '',
      features: [''],
      maxMembers: '',
      isActive: true,
      sortOrder: 0,
    });
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : undefined,
      trialDays: formData.trialDays ? parseInt(formData.trialDays) : undefined,
      features: formData.features.filter((f) => f.trim() !== ''),
    };

    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const handleEditPlan = (plan: MemberSubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      currency: plan.currency,
      billingCycle: plan.billingCycle as any,
      durationDays: plan.durationDays || 30,
      trialDays: plan.trialDays ? String(plan.trialDays) : '',
      features: plan.features.length > 0 ? plan.features : [''],
      maxMembers: plan.maxMembers ? String(plan.maxMembers) : '',
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
    });
    setIsModalOpen(true);
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900">Subscription Plans</h2>
          <p className="text-slate-500 text-sm">
            Create and manage subscription plans for your members
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition"
        >
          <Plus size={18} />
          Create Plan
        </button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
              <div className="h-8 bg-slate-100 rounded-lg mb-4" />
              <div className="h-4 bg-slate-100 rounded-lg mb-2" />
              <div className="h-4 bg-slate-100 rounded-lg mb-4 w-2/3" />
              <div className="h-12 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : plans?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <p className="text-slate-500 text-lg">
            No subscription plans yet. Create your first plan!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-2 ${
                      plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {plan.isActive ? (
                      <CheckCircle size={12} className="mr-1" />
                    ) : (
                      <XCircle size={12} className="mr-1" />
                    )}
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => deletePlanMutation.mutate(plan.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <p className="text-slate-600 text-sm mb-4">{plan.description}</p>

              <div className="mb-4">
                <p className="text-3xl font-black text-sky-600">
                  {plan.currency} {plan.price.toLocaleString()}
                </p>
                <p className="text-slate-500 text-sm">per {plan.billingCycle}</p>
                {plan.trialDays && (
                  <p className="text-amber-600 text-sm font-bold mt-1">
                    {plan.trialDays} days free trial for new users
                  </p>
                )}
              </div>

              {plan.features.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <div className="text-xs text-slate-500">
                {plan.maxMembers && <p>Max members: {plan.maxMembers}</p>}
                <p>Billing cycle: {plan.billingCycle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  placeholder="e.g., Basic Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  rows={3}
                  placeholder="Brief description of the plan"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingCycle: e.target.value as any,
                        durationDays:
                          e.target.value === 'monthly' ? 30 : e.target.value === 'quarterly' ? 90 : 365,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trial Days</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                    placeholder="Leave empty for no trial"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Features</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 rounded-xl border border-slate-300 px-4 py-2 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                      placeholder="Feature description"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-2 text-sky-600 font-bold text-sm hover:text-sky-500"
                >
                  <Plus size={16} />
                  Add Feature
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Max Members</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">
                  Plan is active
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 transition disabled:opacity-50"
                >
                  {createPlanMutation.isPending || updatePlanMutation.isPending ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgSubscriptionPlans;
