import React, { useState } from 'react';
// Subscription Plan Management for SuperAdmin
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plan } from '../../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Zap, 
  Users, 
  Clock, 
  CheckCircle2,
  MoreVertical,
  DollarSign
} from 'lucide-react';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const PlanManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    billing_cycle: 'monthly',
    type: 'business',
    max_members: 0,
    duration_days: 30,
  });

  const queryClient = useQueryClient();
  useBodyScrollLock(isModalOpen);

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (newPlan: any) => api.post('/plans', newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedPlan: any) => api.put(`/plans/${updatedPlan.id}`, updatedPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        type: plan.type,
        max_members: plan.max_members,
        duration_days: plan.duration_days,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: 0,
        billing_cycle: 'monthly',
        type: 'business',
        max_members: 0,
        duration_days: 30,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate({ ...formData, id: editingPlan.id });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredPlans = plans?.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-poppins">
      <div className="flex justify-between items-center text-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Upgrade Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage organization subscription plans and limits</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20 text-sm font-bold"
        >
          <Plus size={18} />
          <span>Create New Plan</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Available Plans</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all text-sm font-medium outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-4">Plan Name</th>
                <th className="px-8 py-4">Price & Cycle</th>
                <th className="px-8 py-4">Limits</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-sm text-slate-400 font-medium">Loading plans...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPlans?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No plans found. Create your first plan to get started.
                  </td>
                </tr>
              ) : (
                filteredPlans?.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-sm">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{plan.name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{plan.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                          <DollarSign size={14} className="text-emerald-500" />
                          {Number(plan.price).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 font-medium capitalize">{plan.billing_cycle}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                          <Users size={14} className="text-indigo-400" />
                          {plan.max_members} members
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Clock size={12} />
                          {plan.duration_days} days duration
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center space-x-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                        <CheckCircle2 size={12} />
                        <span>Active</span>
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          title="Edit plan"
                          onClick={() => openModal(plan)}
                          className="p-2 bg-white shadow-sm border border-slate-100 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          title="Delete plan"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this plan? This may affect existing organizations.')) {
                              deleteMutation.mutate(String(plan.id));
                            }
                          }}
                          className="p-2 bg-white shadow-sm border border-slate-100 rounded-xl hover:text-red-600 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">{editingPlan ? 'Edit Upgrade Plan' : 'Create New Plan'}</h3>
                <p className="text-xs text-slate-500 mt-1">Configure subscription details and limits</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    placeholder="e.g. Professional"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Billing Cycle</label>
                  <select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none appearance-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">One-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Max Members</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.max_members}
                      onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Duration (Days)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3.5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       <span>Saving...</span>
                    </div>
                  ) : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
